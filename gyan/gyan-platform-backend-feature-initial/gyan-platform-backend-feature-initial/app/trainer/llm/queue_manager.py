# queue_manager.py

from datetime import datetime
from app.models.training_job import TrainingJob  
from app.database.crud import DBOperations

# TaskNode class to represent a task in the queue
class TaskNode:
    def __init__(self, task_id,file_obj,content, queue_status='pending', enqueued_at=None):
        
        
        self.file_content = file_obj 
        self.task_id = task_id  # The unique ID of the task
        self.queue_status = queue_status  # Status of the task (e.g., 'pending', 'in_progress')
        self.enqueued_at = enqueued_at if enqueued_at else datetime.now()  # Timestamp for when the task was added
        self.next = None  # Pointer to the next task node in the queue
        self.filename = self.file_content.filename  # File name
        self.content = content  # File content (as bytes)
        self.train_instance = None  

# TaskQueue class to manage a queue of TaskNodes using a linked list
class TaskQueue:
    def __init__(self):
        self.head = None  # Points to the first task in the queue
        self.tail = None  # Points to the last task in the queue

    def enqueue(self, task_node):
        """Add a task to the end of the queue."""
        print("adding element to the queue")
        if self.tail:
            # If the queue is not empty, add the new task after the tail
            print("inside if")
            self.tail.next = task_node
            self.tail = task_node
        else:
            # If the queue is empty, the new task is both the head and the tail
            print("inside else")
            self.head = self.tail = task_node

    def is_empty(self):
        """Check if the queue is empty."""
        return self.head is None
    
    
    def dequeue(self):
        """Remove and return the task from the front of the queue."""
        # if self.head is None:
        #     return None  # Return None if the queue is empty
        # else:
        #     task_to_process = self.head
        #     self.head = self.head.next  # Move the head to the next task
        #     if not self.head:
        #         self.tail = None  # If the queue is empty, set the tail to None
            
        #     return task_to_process

        if self.is_empty():
            return None
        task = self.head
        self.head = self.head.next
        if self.head is None:
            self.tail = None
        return task
        


    def peek(self):
        """Return the task at the front of the queue without removing it."""
        return self.head

    def get_all_tasks(self):
        """Return a list of all tasks in the queue with their statuses."""
        tasks = []
        current_task = self.head
        while current_task:
            tasks.append({
                'task_id': current_task.task_id,
                'status': current_task.queue_status,
                'enqueued_at': current_task.enqueued_at
            })
            current_task = current_task.next
        return tasks
    
    
