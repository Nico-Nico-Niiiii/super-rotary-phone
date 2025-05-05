from fastapi import APIRouter, Depends, HTTPException, File, Form, UploadFile, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
import psutil
import subprocess
import shutil
from typing import Optional, List, Dict
import os
from pathlib import Path
from ..core.utils import get_route, get_prefix, load_endpoints

from fastapi import APIRouter, HTTPException, Depends
from kubernetes import client, config
from kubernetes.client.rest import ApiException
import yaml
import time
import re
import json
import random

from ..database.connection import get_db
from ..database.crud import DBOperations
from ..core.security import get_current_user

import tempfile
from pathlib import Path
from typing import Dict, Any, Optional
from app.cfg.config_loader import Config
from ..models.deployment import YAMLGenerationRequest, YAMLDeployRequest, ServiceResponse, ErrorResponse
from ..core.utils import get_route, get_prefix, load_endpoints
from app.deployment.deploy_gyan import infer as deploy_infer
from app.schemas.deployment import ServiceInfo, NamespaceRequest, DeletePodRequest, DeleteResponse



try:
    config.load_kube_config()
except Exception as e:
    print(f"Error loading kube config: {e}")

ENDPOINTS = load_endpoints()

cfg = Config()
paths = cfg.load("./cfg/paths.json")
YAML_DIRECTORY = paths["deployment"]["deploy_gyan"]["yaml_dir"]
TEMPLATES_DIRECTORY = paths["deployment"]["deploy_gyan"]["templates_dir"]
main_dir = paths["deployment"]["deploy_gyan"]["mount_dir"]
docker_dir = paths["deployment"]["deploy_gyan"]["docker_dir"]

# Create required directories
pv_dir = os.path.join(main_dir, "PV_YAMLS")
pvc_dir = os.path.join(main_dir, "PVC_YAMLS")
model_store_dir = os.path.join(main_dir, "MODEL_STORE_YAMLS")

os.makedirs(YAML_DIRECTORY, exist_ok=True)
os.makedirs(main_dir, exist_ok=True)
os.makedirs(pv_dir, exist_ok=True)
os.makedirs(pvc_dir, exist_ok=True)
os.makedirs(model_store_dir, exist_ok=True)

router = APIRouter(prefix=ENDPOINTS["deployment"]["prefix"], tags=["deployment"])

class SystemResources(BaseModel):
    available_cpus: int
    available_gpus: int
    available_memory_gb: float
    available_disk_gb: float
    cpu_usage_percent: float
    memory_usage_percent: float
    gpu_info: Optional[list] = []
    status: str

def get_directory_free_space(directory: str) -> dict:
    """Get free space in a directory in GB."""
    try:
        total, used, free = shutil.disk_usage(directory)
        return {
            'total_space_gb': total / (2**30),  # Convert bytes to GB
            'used_space_gb': used / (2**30),
            'free_space_gb': free / (2**30)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting disk space: {str(e)}")

def get_gpu_info() -> list:
    """Get detailed GPU information using nvidia-smi."""
    try:
        result = subprocess.run([
            'nvidia-smi',
            '--query-gpu=gpu_name,memory.total,memory.free,memory.used,temperature.gpu,utilization.gpu',
            '--format=csv,noheader,nounits'
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        if result.returncode != 0:
            return []
            
        gpu_info = []
        for line in result.stdout.strip().split('\n'):
            if line:
                name, total_mem, free_mem, used_mem, temp, util = line.split(', ')
                gpu_info.append({
                    'name': name,
                    'total_memory_gb': float(total_mem) / 1024,  # Convert MB to GB
                    'free_memory_gb': float(free_mem) / 1024,
                    'used_memory_gb': float(used_mem) / 1024,
                    'temperature_c': float(temp),
                    'utilization_percent': float(util)
                })
        return gpu_info
    except FileNotFoundError:
        return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting GPU info: {str(e)}")

@router.get(ENDPOINTS["deployment"]["routes"]["check_system_resourses"])
async def get_system_resources():
    """
    Get system resource information including CPU, GPU, memory, and disk space.
    
    Returns:
        SystemResources: Object containing system resource information
    """
    try:
        # Get CPU information
        available_cpus = psutil.cpu_count(logical=True)
        cpu_usage = psutil.cpu_percent(interval=1)
        
        # Get memory information
        memory = psutil.virtual_memory()
        memory_gb = memory.total / (2**30)  # Convert to GB
        memory_usage = memory.percent
        
        # Get disk space (using current directory)
        current_dir = os.getcwd()
        disk_info = get_directory_free_space(current_dir)
        
        # Get GPU information
        gpu_info = get_gpu_info()
        available_gpus = len(gpu_info)
        
        return SystemResources(
            available_cpus=available_cpus,
            available_gpus=available_gpus,
            available_memory_gb=round(memory_gb, 2),
            available_disk_gb=round(disk_info['free_space_gb'], 2),
            cpu_usage_percent=round(cpu_usage, 2),
            memory_usage_percent=round(memory_usage, 2),
            gpu_info=gpu_info,
            status="success"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching system resources: {str(e)}"
        )





#  latest code 
@router.post(ENDPOINTS["deployment"]["routes"]["generate_yaml"])
async def generate_yaml(
    request: YAMLGenerationRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> ServiceResponse:
    try:
        # First merge and save model weights
        temp_dir, model_save_path =  deploy_infer.merge_and_save_lora_weights(
            request.model_type,
            request.model_name,
            request.project_name,
            current_user["email"],
            request.job_name
        )

        if isinstance(model_save_path, dict) and 'error' in model_save_path:
            raise HTTPException(status_code=500, detail=model_save_path['error'])
        print("Model save path", model_save_path)
        # Validate system resources
        # available_cpus = psutil.cpu_count(logical=True)
        # if request.cpu_request > available_cpus:
        #     raise HTTPException(
        #         status_code=400,
        #         detail=f"Requested CPU resource ({request.cpu_request}) exceeds available CPUs ({available_cpus})"
        #     )

        # GPU validation
        # try:
        #     result = subprocess.run(
        #         ['nvidia-smi', '--query-gpu=gpu_name', '--format=csv,noheader'],
        #         stdout=subprocess.PIPE
        #     )
        #     available_gpus = len(result.stdout.decode('utf-8').splitlines())
        #     if request.gpu_request > available_gpus:
        #         raise HTTPException(
        #             status_code=400,
        #             detail=f"Requested GPU resource ({request.gpu_request}) exceeds available GPUs ({available_gpus})"
        #         )
        # except FileNotFoundError:
        #     raise HTTPException(
        #         status_code=400,
        #         detail="NVIDIA GPUs not detected or 'nvidia-smi' command not found"
        #     )

        # Memory validation
        # directory_space = get_directory_free_space(docker_dir)
        # available_disk_space = directory_space['free_space_gb']
        # if request.memory_request > available_disk_space:
        #     raise HTTPException(
        #         status_code=400,
        #         detail=f"Requested memory ({request.memory_request} GB) exceeds available memory ({available_disk_space:.2f} GB)"
        #     )

        # Process project name
        project_name = request.job_name.lower()
        project_name = re.sub(r'[^a-z0-9]', '-', project_name)
        pv_name = f"{project_name}-pv"
        pvc_name = f"{project_name}-pvc"

        # Generate PV YAML with model_save_path
        pv_yaml_content = {
            "apiVersion": "v1",
            "kind": "PersistentVolume",
            "metadata": {
                "name": pv_name,
            },
            "spec": {
                "capacity": {
                    "storage": f"{request.memory_request}Gi",
                },
                "accessModes": ["ReadWriteOnce"],
                "hostPath": {
                    "path": model_save_path  # Use the actual model path
                }
            }
        }

        pv_yaml_str = yaml.dump(pv_yaml_content, sort_keys=False)
        pv_file_name = f"pv_{project_name}_vllm.yaml"
        pv_file_path = os.path.join(pv_dir, pv_file_name)

        with open(pv_file_path, 'w') as file:
            file.write(pv_yaml_str)

        # Generate PVC YAML
        pvc_yaml_content = {
            "apiVersion": "v1",
            "kind": "PersistentVolumeClaim",
            "metadata": {
                "name": pvc_name
            },
            "spec": {
                "accessModes": ["ReadWriteOnce"],
                "resources": {
                    "requests": {
                        "storage": f"{request.memory_request}Gi"
                    }
                }
            }
        }

        pvc_yaml_str = yaml.dump(pvc_yaml_content, sort_keys=False)
        pvc_file_name = f"pvc_{project_name}_vllm.yaml"
        pvc_file_path = os.path.join(pvc_dir, pvc_file_name)

        with open(pvc_file_path, 'w') as file:
            file.write(pvc_yaml_str)

        # Generate Model Store Pod YAML
        model_store_pod_yaml_content = {
            "apiVersion": "v1",
            "kind": "Pod",
            "metadata": {
                "name": f"model-store-pod-{project_name}"
            },
            "spec": {
                "volumes": [
                    {
                        "name": "model-store",
                        "persistentVolumeClaim": {
                            "claimName": pvc_name
                        }
                    }
                ],
                "containers": [
                    {
                        "name": "model-store",
                        "image": "ubuntu",
                        "command": ["sleep"],
                        "args": ["infinity"],
                        "volumeMounts": [
                            {
                                "mountPath": "/mnt/models",
                                "name": "model-store"
                            }
                        ],
                        "resources": {
                            "limits": {
                                "memory": f"{request.memory_request}Gi",
                                "cpu": request.cpu_request
                            }
                        }
                    }
                ]
            }
        }

        pod_yaml_str = yaml.dump(model_store_pod_yaml_content, sort_keys=False)
        model_store_file_name = f"model-store-pod_{project_name}_vllm.yaml"
        model_store_file_path = os.path.join(model_store_dir, model_store_file_name)

        with open(model_store_file_path, 'w') as file:
            file.write(pod_yaml_str)

        # Generate main deployment YAML
        yaml_content = {
            "apiVersion": "serving.kserve.io/v1beta1",
            "kind": "InferenceService",
            "metadata": {
                "namespace": request.namespace,
                "name": project_name + "-vllm",
                "annotations": {
                    "original-service-name": project_name
                }
            },
            "spec": {
                "predictor": {
                    "minReplicas": 0,
                    "maxReplicas": 1,
                    "containers": [
                        {
                            "args": [
                                "--port",
                                "8080",
                                "--model",
                                "/mnt/models"
                            ],
                            "command": [
                                "python3",
                                "-m",
                                "vllm.entrypoints.openai.api_server"
                            ],
                            "env": [
                                {
                                    "name": "STORAGE_URI",
                                    "value": f"pvc://{pvc_name}/model_files/"
                                }
                            ],
                            "image": request.docker_image,
                            "imagePullPolicy": "IfNotPresent",
                            "name": "kserve-container",
                            "resources": {
                                "limits": {
                                    "cpu": request.cpu_limit,
                                    "memory": f"{request.memory_limit}Gi",
                                    "nvidia.com/gpu": request.gpu_limit
                                },
                                "requests": {
                                    "cpu": request.cpu_request,
                                    "memory": f"{request.memory_request}Gi",
                                    "nvidia.com/gpu": request.gpu_request
                                }
                            }
                        }
                    ]
                }
            }
        }

        yaml_str = yaml.dump(yaml_content, sort_keys=False)
        deployment_file_name = f"{project_name}_vllm_deployment.yaml"
        full_path = os.path.join(YAML_DIRECTORY, deployment_file_name)

        with open(full_path, 'w') as file:
            file.write(yaml_str)

        # Apply PV, PVC, and model store pod
        pv_command = f"kubectl apply -f {pv_file_path}"
        pvc_command = f"kubectl apply -f {pvc_file_path}"
        model_command = f"kubectl apply -f {model_store_file_path}"
        copy_command = f"kubectl cp {model_save_path}/. model-store-pod-{project_name}:/mnt/models/model_files/"

        pv_result = subprocess.run(pv_command, shell=True, capture_output=True, text=True)
        pvc_result = subprocess.run(pvc_command, shell=True, capture_output=True, text=True)
        model_store_pod_result = subprocess.run(model_command, shell=True, capture_output=True, text=True)
        time.sleep(10)
        copy_model_result = subprocess.run(copy_command, shell=True, capture_output=True, text=True)
        time.sleep(5)

        if copy_model_result.returncode == 0:
            print("Model copied successfully.")
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
                print(f"Temporary directory {temp_dir} has been removed.")
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Error copying model: {copy_model_result.stderr}"
            )

        return ServiceResponse(
            yaml=yaml_str,
            message=f"YAML saved as {deployment_file_name}"
        )

    except Exception as e:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
        raise HTTPException(status_code=500, detail=str(e))
    



# generate custom server yaml
@router.post(ENDPOINTS["deployment"]["routes"]["generate_yaml_custom"])
async def generate_yaml_custom(
    request: YAMLGenerationRequest,
    current_user: dict = Depends(get_current_user)
) -> ServiceResponse:
    try:
        # First merge and save model weights
        temp_dir, model_save_path =  deploy_infer.merge_and_save_lora_weights(
            request.model_type,
            request.model_name,
            request.project_name,
            current_user["email"],
            request.job_name
        )

        if isinstance(model_save_path, dict) and 'error' in model_save_path:
            raise HTTPException(status_code=500, detail=model_save_path['error'])
        print("Model save path", model_save_path)
        # System resource validation
        # CPU validation
        # available_cpus = psutil.cpu_count(logical=True)
        # if request.cpu_request > available_cpus:
        #     raise HTTPException(
        #         status_code=400,
        #         detail=f"Requested CPU resource ({request.cpu_request}) exceeds available CPUs ({available_cpus})"
        #     )

        # GPU validation
        # try:
        #     result = subprocess.run(['nvidia-smi', '--query-gpu=gpu_name', '--format=csv,noheader'], stdout=subprocess.PIPE)
        #     available_gpus = len(result.stdout.decode('utf-8').splitlines())
        #     if request.gpu_request > available_gpus:
        #         raise HTTPException(
        #             status_code=400,
        #             detail=f"Requested GPU resource ({request.gpu_request}) exceeds available GPUs ({available_gpus})"
        #         )
        # except FileNotFoundError:
        #     raise HTTPException(
        #         status_code=400,
        #         detail="NVIDIA GPUs not detected or 'nvidia-smi' command not found"
        #     )

        # Memory validation
        # directory_space = get_directory_free_space(docker_dir)
        # available_disk_space = directory_space['free_space_gb']
        # if request.memory_request > available_disk_space:
        #     raise HTTPException(
        #         status_code=400,
        #         detail=f"Requested memory ({request.memory_request} GB) exceeds available memory ({available_disk_space:.2f} GB)"
        #     )

        # Process project name and generate dynamic port
        project_name = request.job_name.lower()
        project_name = re.sub(r'[^a-z0-9]', '-', project_name)
        pv_name = f"{project_name}-pv"
        pvc_name = f"{project_name}-pvc"
        dynamic_port = random.randint(5000, 10000)

        # Generate PV YAML
        # pv_yaml_content = {
        #     "apiVersion": "v1",
        #     "kind": "PersistentVolume",
        #     "metadata": {
        #         "name": pv_name,
        #     },
        #     "spec": {
        #         "capacity": {
        #             "storage": f"{request.memory_request}Gi",
        #         },
        #         "accessModes": ["ReadWriteOnce"],
        #         "hostPath": {
        #             "path": model_save_path
        #         }
        #     }
        # }

        pv_yaml_content = {
            "apiVersion": "v1",
            "kind": "PersistentVolume",
            "metadata": {
                "name": pv_name,
            },
            "spec": {
                "capacity": {
                    "storage": f"{request.memory_request}Gi",
                },
                "accessModes": ["ReadWriteOnce"],
                "hostPath": {
                    "path": model_save_path
                },
                # Add claimRef to bind the PV to the PVC
                "claimRef": {
                    "apiVersion": "v1",
                    "kind": "PersistentVolumeClaim",
                    "name": pvc_name,  # PVC you want to bind this PV to
                    "namespace": "knative-serving"  # Namespace of your PVC
                },
                "reclaimPolicy": "Retain"
            }
        }

        pv_yaml_str = yaml.dump(pv_yaml_content, sort_keys=False)
        pv_file_name = f"pv_{project_name}_custom.yaml"
        pv_file_path = os.path.join(pv_dir, pv_file_name)

        with open(pv_file_path, 'w') as file:
            file.write(pv_yaml_str)

        # Generate PVC YAML
        pvc_yaml_content = {
            "apiVersion": "v1",
            "kind": "PersistentVolumeClaim",
            "metadata": {
                "name": pvc_name
            },
            "spec": {
                "accessModes": ["ReadWriteOnce"],
                "resources": {
                    "requests": {
                        "storage": f"{request.memory_request}Gi"
                    }
                }
            }
        }

        pvc_yaml_str = yaml.dump(pvc_yaml_content, sort_keys=False)
        pvc_file_name = f"pvc_{project_name}_custom.yaml"
        pvc_file_path = os.path.join(pvc_dir, pvc_file_name)

        with open(pvc_file_path, 'w') as file:
            file.write(pvc_yaml_str)

        # Generate Model Store Pod YAML
        model_store_pod_yaml_content = {
            "apiVersion": "v1",
            "kind": "Pod",
            "metadata": {
                "name": f"model-store-pod-{project_name}"
            },
            "spec": {
                "containers": [{
                    "name": "model-store-container",
                    "image": "busybox",
                    "command": ["sleep", "3600"],
                    "volumeMounts": [{
                        "mountPath": "/mnt/models",
                        "name": "model-storage"
                    }]
                }],
                "volumes": [{
                    "name": "model-storage",
                    "persistentVolumeClaim": {
                        "claimName": pvc_name
                    }
                }]
            }
        }

        pod_yaml_str = yaml.dump(model_store_pod_yaml_content, sort_keys=False)
        model_store_file_name = f"model-store-pod_{project_name}_custom.yaml"
        model_store_file_path = os.path.join(model_store_dir, model_store_file_name)

        with open(model_store_file_path, 'w') as file:
            file.write(pod_yaml_str)

        # Generate InferenceService YAML
        yaml_content = {
            "apiVersion": "serving.kserve.io/v1beta1",
            "kind": "InferenceService",
            "metadata": {
                "namespace": request.namespace,
                "name": project_name,
                "annotations": {
                    "original-service-name": project_name
                }
            },
            "spec": {
                "predictor": {
                    "minReplicas": 0,
                    "maxReplicas": 1,
                    "containers": [{
                        "name": f"{project_name}-custom_container",
                        "image": request.docker_image,
                        "imagePullPolicy": "IfNotPresent",
                        "ports": [{"containerPort": dynamic_port}],
                        "command": ["python", "custom_server.py"],
                        "args": [
                            "--port", f"{dynamic_port}",
                            "--model", "/mnt/models"
                        ],
                        "env": [
                            {"name": "MODEL_PATH", "value": "/mnt/models/model_files"},
                            {"name": "MODEL_NAME", "value": "demo"},
                            {"name": "CUSTOM_PORT", "value": f"{dynamic_port}"}
                        ],
                        "resources": {
                            "limits": {
                                "cpu": request.cpu_limit,
                                "memory": f"{request.memory_limit}Gi",
                                "nvidia.com/gpu": request.gpu_limit
                            },
                            "requests": {
                                "cpu": request.cpu_request,
                                "memory": f"{request.memory_request}Gi",
                                "nvidia.com/gpu": request.gpu_request
                            }
                        },
                        "volumeMounts": [{
                            "name": f"{project_name}-model-volume",
                            "mountPath": "/mnt/models",
                            "readOnly": True 
                        }]
                    }],
                    "volumes": [{
                        "name": f"{project_name}-model-volume",
                        "persistentVolumeClaim": {
                            "claimName": pvc_name,
                            "readOnly": True 
                        }
                    }]
                }
            }
        }

        # Generate Service YAML
        service_yaml_content = {
            "apiVersion": "v1",
            "kind": "Service",
            "metadata": {
                "name": f"{project_name}-service",
                "namespace": request.namespace
            },
            "spec": {
                "selector": {
                    "kserve.io/inferenceservice": project_name
                },
                "ports": [{
                    "protocol": "TCP",
                    "port": 80,
                    "targetPort": dynamic_port
                }],
                "type": "LoadBalancer"
            }
        }

        inference_service_yaml_str = yaml.dump(yaml_content, sort_keys=False)
        service_yaml_str = yaml.dump(service_yaml_content, sort_keys=False)
        combined_yaml_str = f"{inference_service_yaml_str}---\n{service_yaml_str}"

        deployment_file_name = f"{project_name}_custom_deployment.yaml"
        full_path = os.path.join(YAML_DIRECTORY, deployment_file_name)

        with open(full_path, 'w') as file:
            file.write(combined_yaml_str)

        print("will apply kubectl")

        # Apply the Kubernetes resources
        pv_command = f"kubectl apply -f {pv_file_path}"
        pvc_command = f"kubectl apply -f {pvc_file_path}"
        model_command = f"kubectl apply -f {model_store_file_path}"
        copy_command = f"kubectl cp {model_save_path}/. model-store-pod-{project_name}:/mnt/models/model_files/"

        pv_result = subprocess.run(pv_command, shell=True, capture_output=True, text=True)
        pvc_result = subprocess.run(pvc_command, shell=True, capture_output=True, text=True)
        model_store_pod_result = subprocess.run(model_command, shell=True, capture_output=True, text=True)
        time.sleep(10)
        copy_model_result = subprocess.run(copy_command, shell=True, capture_output=True, text=True)
        time.sleep(5)

        if copy_model_result.returncode == 0:
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
                print(f"Temporary directory {temp_dir} has been removed.")
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Error copying model: {copy_model_result.stderr}"
            )

        return ServiceResponse(
            yaml=combined_yaml_str,
            message=f"YAML saved as {deployment_file_name}"
        )

    except Exception as e:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
        print(str(e))
        raise HTTPException(status_code=500, detail=str(e))



# get pods
@router.post(ENDPOINTS["deployment"]["routes"]["get_pods"], response_model=List[ServiceInfo])
async def get_inferenceservices(request: NamespaceRequest):
    """
    Get details of inference services in a specified namespace.
    """
    if not request.namespace:
        raise HTTPException(status_code=400, detail="Namespace is required")
    
    try:
        result = subprocess.run(
            ["kubectl", "get", "inferenceservices", "-n", request.namespace, "-o", "json"],
            capture_output=True,
            text=True,
            check=True
        )
        inferenceservices = json.loads(result.stdout).get('items', [])
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail="Error decoding JSON response")
    
    service_details = []
    for service in inferenceservices:
        metadata = service.get('metadata', {})
        pod_name = metadata.get('name', 'N/A')
        endpoint = 'Unknown'
        spec = service.get('spec', {})
        predictor = spec.get('predictor', {})
        containers = predictor.get('containers', [])
        
        # Check each container to determine the correct endpoint
        for container in containers:
            image = container.get('image', '')
            if 'vllm' in image.lower():
                endpoint = 'v1/completions'
            else:
                endpoint = 'v1/models/demo'
        
        status = service.get('status', {})
        host_url = status.get('url', 'N/A')
        if not host_url:
            address = status.get('address', {})
            host_url = address.get('url', 'N/A')
        
        # Determine the status
        conditions = status.get('conditions', [])
        service_status = 'Unknown'
        for condition in conditions:
            if condition.get('type') == 'Ready':
                if condition.get('status') == 'True':
                    service_status = 'Ready'
                elif condition.get('status') == 'False':
                    service_status = 'False'
                break
        
        service_info = ServiceInfo(
            pod_name=pod_name,
            endpoint=endpoint,
            host_url=host_url,
            namespace=request.namespace,
            status=service_status
        )
        service_details.append(service_info)
    
    return service_details


# @router.post(ENDPOINTS["deployment"]["routes"]["del_pods"], 
#     response_model=DeleteResponse,
#     responses={
#         400: {"model": dict, "description": "Bad Request"},
#         500: {"model": dict, "description": "Internal Server Error"}
#     }
# )
# async def delete_pod(
#     request: DeletePodRequest,
#     current_user: dict = Depends(get_current_user)  # Keep consistent with your auth pattern
# ) -> DeleteResponse:
#     """Delete a pod and its associated resources."""
    
#     if not request.pod_name:
#         raise HTTPException(status_code=400, detail="Pod name is required")
#     print("request", request)
#     inference_service_name = request.pod_name
    
#     try:
#         # Delete inference service
#         custom_api = client.CustomObjectsApi()
#         print(f"Deleting inference service: {inference_service_name} in namespace: {request.namespace}")
        
#         try:
#             response = custom_api.delete_namespaced_custom_object(
#                 group="serving.kserve.io",
#                 version="v1beta1",
#                 namespace=request.namespace,
#                 plural="inferenceservices",
#                 name=inference_service_name
#             )
#             print(f"Inference service {inference_service_name} deleted.")
#         except ApiException as e:
#             print("error", str(e))
#             if e.status == 404:
#                 print(f"No inference service found for {inference_service_name}.")
#             else:
#                 raise HTTPException(
#                     status_code=500, 
#                     detail=f"Failed to delete inference service {inference_service_name}: {str(e)}"
#                 )

#         # Get original service name
#         try:
#             service = custom_api.get_namespaced_custom_object(
#                 group="serving.kserve.io",
#                 version="v1beta1",
#                 namespace=request.namespace,
#                 plural="inferenceservices",
#                 name=inference_service_name
#             )
#             metadata = service.get('metadata', {})
#             original_service_name = metadata.get('annotations', {}).get(
#                 'original-service-name', 
#                 inference_service_name
#             )
#             print("PVC NAME : ", f"{original_service_name}-pvc")
#         except ApiException as e:
#             if e.status != 404:  # Ignore 404 errors as the service might be already deleted
#                 raise HTTPException(
#                     status_code=500, 
#                     detail=f"Failed to retrieve original service name: {str(e)}"
#                 )
#             original_service_name = inference_service_name

#         # Delete associated resources
#         v1 = client.CoreV1Api()
#         pv_name = f"{original_service_name}-pv"
#         pvc_name = f"{original_service_name}-pvc"
#         model_store_pod_name = f"model-store-pod-{original_service_name}"

#         # Delete PVC
#         try:
#             v1.delete_namespaced_persistent_volume_claim(
#                 name=pvc_name, 
#                 namespace=request.namespace
#             )
#             print(f"PVC {pvc_name} deleted.")
#         except ApiException as e:
#             if e.status != 404:
#                 print(f"Error deleting PVC {pvc_name}: {str(e)}")

#         # Delete PV
#         try:
#             v1.delete_persistent_volume(name=pv_name)
#             print(f"PV {pv_name} deleted.")
#         except ApiException as e:
#             if e.status != 404:
#                 print(f"Error deleting PV {pv_name}: {str(e)}")

#         # Delete model store pod
#         try:
#             v1.delete_namespaced_pod(
#                 name=model_store_pod_name, 
#                 namespace=request.namespace
#             )
#             print(f"Model store pod {model_store_pod_name} deleted.")
#         except ApiException as e:
#             if e.status != 404:
#                 print(f"Error deleting model store pod {model_store_pod_name}: {str(e)}")

#         return DeleteResponse(
#             message=f'Service {request.pod_name} and associated resources deleted successfully'
#         )

#     except Exception as e:
#         raise HTTPException(
#             status_code=500, 
#             detail=f"Unexpected error during deletion: {str(e)}"
#         )



@router.post(ENDPOINTS["deployment"]["routes"]["del_pods"])
async def delete_pod(request: DeletePodRequest):
    """Delete a pod and its associated resources."""
    try:
        # Initialize Kubernetes clients
        custom_api = client.CustomObjectsApi()
        v1 = client.CoreV1Api()
        
        pod_name = request.pod_name
        namespace = request.namespace or 'default'

        print(f"Deleting inference service: {pod_name} in namespace: {namespace}")

        # Delete inference service
        try:
            response = custom_api.delete_namespaced_custom_object(
                group="serving.kserve.io",
                version="v1beta1",
                namespace=namespace,
                plural="inferenceservices",
                name=pod_name,
                body=client.V1DeleteOptions()  # Add this line
            )
            print(f"Inference service {pod_name} deleted")
        except ApiException as e:
            if e.status != 404:  # Ignore if already deleted
                print(f"Error deleting inference service: {e}")
                # Continue with other deletions even if this fails

        # Get original service name
        try:
            service = custom_api.get_namespaced_custom_object(
                group="serving.kserve.io",
                version="v1beta1",
                namespace=namespace,
                plural="inferenceservices",
                name=pod_name
            )
            metadata = service.get('metadata', {})
            original_service_name = metadata.get('annotations', {}).get('original-service-name', pod_name)
        except ApiException as e:
            print(f"Error getting service info (using pod_name as fallback): {e}")
            original_service_name = pod_name

        # Delete PVC
        pvc_name = f"{original_service_name}-pvc"
        try:
            v1.delete_namespaced_persistent_volume_claim(
                name=pvc_name,
                namespace=namespace,
                body=client.V1DeleteOptions()  # Add this line
            )
            print(f"PVC {pvc_name} deleted")
        except ApiException as e:
            if e.status != 404:
                print(f"Error deleting PVC: {e}")

        # Delete PV
        pv_name = f"{original_service_name}-pv"
        try:
            v1.delete_persistent_volume(
                name=pv_name,
                body=client.V1DeleteOptions()  # Add this line
            )
            print(f"PV {pv_name} deleted")
        except ApiException as e:
            if e.status != 404:
                print(f"Error deleting PV: {e}")

        # Delete model store pod
        model_store_pod_name = f"model-store-pod-{original_service_name}"
        try:
            v1.delete_namespaced_pod(
                name=model_store_pod_name,
                namespace=namespace,
                body=client.V1DeleteOptions()  # Add this line
            )
            print(f"Model store pod {model_store_pod_name} deleted")
        except ApiException as e:
            if e.status != 404:
                print(f"Error deleting model store pod: {e}")

        return {
            "message": f"Successfully deleted service {pod_name} and associated resources"
        }

    except Exception as e:
        print(f"Unexpected error during deletion: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete resources: {str(e)}"
        )

@router.post(ENDPOINTS["deployment"]["routes"]["deploy_service"])
async def deploy_service(request: YAMLDeployRequest) -> ServiceResponse:
    try:
        # Save the YAML file
        yaml_file_name = "service_deployment.yaml"
        full_path = os.path.join(YAML_DIRECTORY, yaml_file_name)
        
        with open(full_path, 'w') as file:
            file.write(request.yaml_file)

        # Deploy using kubectl
        inference_service_command = f"kubectl apply -f {full_path}"
        inference_service_result = subprocess.run(
            inference_service_command,
            shell=True,
            capture_output=True,
            text=True
        )
        
        # Wait for the deployment to settle
        time.sleep(3)

        if inference_service_result.returncode == 0:
            return ServiceResponse(
                message="Service deployed successfully.",
                yaml=inference_service_result.stdout
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to deploy InferenceService: {inference_service_result.stderr}"
            )

    except subprocess.CalledProcessError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Subprocess error during deployment: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error during deployment: {str(e)}"
        )