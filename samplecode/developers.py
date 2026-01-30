from fastapi import APIRouter, HTTPException
from pynamodb.exceptions import DoesNotExist

from backend.models.developers import DevelopersProxy
from backend.services.developers import DevelopersService as service

router = APIRouter()

@router.get("/developers/{name}")
async def retrieve_developer(name: str)-> DevelopersProxy:
    return service.retrieve_developer(name=name)


@router.post("/developers")
async def create_developer(developer: DevelopersProxy)-> DevelopersProxy:
    try:
        dev_proxy = service.create_developer(developer=developer)
        return dev_proxy
    except ValueError as ve:
        raise HTTPException(status_code=409, detail="Developer already exists.")


@router.patch("/developers")
async def update_developer(developer: DevelopersProxy) -> DevelopersProxy:
    try:
        dev_proxy = service.update_developer(developer=developer)
        return dev_proxy
    except DoesNotExist:
        raise HTTPException(status_code=404, detail="Developer does not exist. Please create a Developer before updating their information.")