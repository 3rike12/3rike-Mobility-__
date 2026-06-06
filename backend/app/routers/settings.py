from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import OrganizationSettings
from app.schemas import (
    SettingsOut, Organization, Thresholds, AiSettings, Notifications,
    UserProfile,
)

router = APIRouter(tags=["settings"])


def _settings_to_out(s: OrganizationSettings) -> SettingsOut:
    return SettingsOut(
        organization=Organization(
            name=s.org_name,
            region=s.org_region,
            currency=s.org_currency,
            timezone=s.org_timezone,
        ),
        thresholds=Thresholds(
            critical_below_pct=s.critical_below_pct,
            warning_below_pct=s.warning_below_pct,
            auto_generate_alerts=bool(s.auto_generate_alerts),
            predictive_warnings=bool(s.predictive_warnings),
        ),
        ai=AiSettings(
            forecast_horizon=s.forecast_horizon,
            auto_redistribute_surplus=bool(s.auto_redistribute_surplus),
            weather_adjusted=bool(s.weather_adjusted),
        ),
        notifications=Notifications(
            critical_alerts=bool(s.critical_alerts),
            daily_digest=bool(s.daily_digest),
            sms_field_team=bool(s.sms_field_team),
            weekly_report=bool(s.weekly_report),
        ),
    )


@router.get("/settings", response_model=SettingsOut)
def get_settings(db: Session = Depends(get_db)):
    s = db.query(OrganizationSettings).first()
    if not s:
        s = OrganizationSettings()
        db.add(s)
        db.commit()
        db.refresh(s)
    return _settings_to_out(s)


@router.patch("/settings", response_model=SettingsOut)
def patch_settings(patch: dict, db: Session = Depends(get_db)):
    s = db.query(OrganizationSettings).first()
    if not s:
        s = OrganizationSettings()
        db.add(s)
        db.flush()

    allowed_fields = {
        "org_name", "org_region", "org_currency", "org_timezone",
        "critical_below_pct", "warning_below_pct", "auto_generate_alerts",
        "predictive_warnings", "forecast_horizon", "auto_redistribute_surplus",
        "weather_adjusted", "critical_alerts", "daily_digest",
        "sms_field_team", "weekly_report",
    }
    for key, value in patch.items():
        if key in allowed_fields:
            if key in ("auto_generate_alerts", "predictive_warnings",
                       "auto_redistribute_surplus", "weather_adjusted",
                       "critical_alerts", "daily_digest", "sms_field_team",
                       "weekly_report"):
                value = int(bool(value))
            setattr(s, key, value)

    db.commit()
    db.refresh(s)
    return _settings_to_out(s)


@router.get("/me", response_model=UserProfile)
def get_me():
    return UserProfile(
        id="usr_ada",
        name="Ada Okafor",
        role="Operator",
        site="Lagos HQ",
        avatar_url=None,
        build_version="v3.2",
        system_status="nominal",
    )
