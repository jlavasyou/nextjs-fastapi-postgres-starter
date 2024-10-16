from sqlalchemy import select
from sqlalchemy.orm import Session
from db_engine import sync_engine
from models import User


def seed_user_if_needed():
    with Session(sync_engine) as session:
        with session.begin():
            user = session.execute(select(User))
            if user is not None:
                print(user)
                print("User already exists, skipping seeding")
                return
            print("Seeding user")
            session.add(User(name="Alice"))
            session.commit()
