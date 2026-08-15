"""Import all models so SQLAlchemy and Alembic receive complete metadata."""

from backend.relational.identity_models import *  # noqa: F401,F403
from backend.relational.practitioner_models import *  # noqa: F401,F403
from backend.relational.referral_models import *  # noqa: F401,F403
from backend.relational.content_models import *  # noqa: F401,F403
