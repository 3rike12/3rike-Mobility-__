from sqlalchemy.orm import Session
from app.models import Station, Prediction
from app.schemas import RebalanceRecommendation


def compute_rebalance(db: Session) -> list[RebalanceRecommendation]:
    stations = db.query(Station).all()
    predictions = (
        db.query(Prediction)
        .order_by(Prediction.hour)
        .all()
    )
    pred_by_station: dict[str, int] = {}
    for p in predictions:
        pred_by_station[p.station_id] = (
            pred_by_station.get(p.station_id, 0) + p.predicted_demand
        )

    recommendations = []
    for station in stations:
        predicted_demand = pred_by_station.get(station.station_id, 0)
        shortfall = predicted_demand - station.current_batteries
        if shortfall > 5:
            donors = [
                s
                for s in stations
                if s.station_id != station.station_id
                and s.current_batteries > 15
            ]
            if donors:
                donor = donors[0]
                move = min(shortfall, donor.current_batteries - 10)
                recommendations.append(
                    RebalanceRecommendation(
                        from_station=donor.station_id,
                        to_station=station.station_id,
                        batteries_to_move=move,
                        reason=(
                            f"{station.name} predicted to need "
                            f"{predicted_demand} batteries but only has "
                            f"{station.current_batteries} in stock"
                        ),
                    )
                )
    return recommendations
