from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import RebalanceRecommendation
from app.services.rebalance import compute_rebalance

router = APIRouter(tags=["rebalance"])


@router.get("/rebalance", response_model=list[RebalanceRecommendation])
def rebalance(db: Session = Depends(get_db)):
    return compute_rebalance(db)
