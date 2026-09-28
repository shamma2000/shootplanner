from fastapi import APIRouter

from app.modules.auth.router import router as auth_router
from app.modules.catalog.router import router as catalog_router
from app.modules.clients.router import router as clients_router
from app.modules.events.router import router as events_router
from app.modules.invoices.router import router as invoices_router
from app.modules.quotations.router import router as quotations_router
from app.modules.studio.router import router as studio_router

api_router = APIRouter()


@api_router.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


api_router.include_router(auth_router, prefix="/auth", tags=["authentication"])
api_router.include_router(clients_router, prefix="/clients", tags=["clients"])
api_router.include_router(events_router, prefix="/events", tags=["events"])
api_router.include_router(quotations_router, prefix="/quotations", tags=["quotations"])
api_router.include_router(invoices_router, prefix="/invoices", tags=["invoices"])
api_router.include_router(catalog_router, prefix="/catalog", tags=["catalog"])
api_router.include_router(studio_router, prefix="/studio", tags=["studio"])
