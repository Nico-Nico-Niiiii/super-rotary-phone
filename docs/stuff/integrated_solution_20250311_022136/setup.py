"""
Setup script for integrated_solution package.
This package combines multiple modules with their relationships preserved.
"""

from setuptools import setup, find_packages

setup(
    name="integrated_solution",
    version="0.1.0",
    packages=find_packages(),
    author="AI Code Generator",
    author_email="ai@example.com",
    description="Integrated solution generated from multiple modules with relationship awareness",
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.6",
)
