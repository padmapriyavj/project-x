"""Shop and inventory HTTP API endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from app_platform.auth.dependencies import get_current_user
from app_platform.shop.schemas import (
    InventoryItemResponse,
    PurchaseRequest,
    PurchaseResponse,
    ShopItemResponse,
)
from app_platform.shop.service import (
    PurchaseError,
    fetch_shop_items,
    fetch_user_inventory,
    process_purchase,
)
from models.user import User

router = APIRouter(prefix="/api/v1", tags=["Shop"])


@router.get("/shop/items", response_model=list[ShopItemResponse])
def list_shop_items(
    category: Annotated[str | None, Query(description="Filter by category")] = None,
) -> list[ShopItemResponse]:
    """
    List all shop items, optionally filtered by category.
    
    Categories: finn_skin, space_item, backdrop, streak_freeze
    """
    items = fetch_shop_items(category)
    return [ShopItemResponse(**item) for item in items]


@router.post("/shop/purchase", response_model=PurchaseResponse)
def purchase_item(
    body: PurchaseRequest,
    current_user: Annotated[User, Depends(get_current_user)],
) -> PurchaseResponse:
    """
    Purchase a shop item.
    
    Deducts coins from user balance and adds item to inventory.
    Returns 402 if insufficient coins, 409 if item already owned (non-consumable).
    """
    try:
        result = process_purchase(current_user.id, body.item_id)
    except PurchaseError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    
    return PurchaseResponse(
        success=True,
        new_balance=result["new_balance"],
        item=ShopItemResponse(**result["item"]),
    )


@router.get("/me/inventory", response_model=list[InventoryItemResponse])
def get_inventory(
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[InventoryItemResponse]:
    """
    List all items in the current user's inventory with placement info.
    """
    items = fetch_user_inventory(current_user.id)
    return [InventoryItemResponse(**item) for item in items]
