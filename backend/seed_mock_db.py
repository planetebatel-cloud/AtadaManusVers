"""
ATADA — Database Seeder
Generates 100 fake jobs and 100 fake candidates for development.
Uses Faker with Israeli-themed data (in English).
Run: python seed_mock_db.py
"""

import random
from faker import Faker
from app.db.database import engine, SessionLocal, Base
from app.domain.models import Job, Candidate, User

fake = Faker()

# ─── Israeli-specific data pools ────────────────────────────────────────────

CITIES = [
    ("Tel Aviv", 32.0853, 34.7818),
    ("Jerusalem", 31.7683, 35.2137),
    ("Haifa", 32.7940, 34.9896),
    ("Beer Sheva", 31.2518, 34.7913),
    ("Netanya", 32.3215, 34.8532),
    ("Herzliya", 32.1629, 34.8443),
    ("Ramat Gan", 32.0680, 34.8248),
    ("Petah Tikva", 32.0868, 34.8876),
    ("Rishon LeZion", 31.9730, 34.7925),
    ("Ashdod", 31.8014, 34.6434),
    ("Rehovot", 31.8928, 34.8077),
    ("Holon", 32.0116, 34.7748),
    ("Raanana", 32.1839, 34.8710),
    ("Kfar Saba", 32.1751, 34.9071),
    ("Modiin", 31.8969, 35.0104),
]

TECH_COMPANIES = [
    "Wix", "Monday.com", "Fiverr", "JFrog", "Elementor", "Rapyd",
    "ironSource", "Taboola", "Outbrain", "CyberArk", "SolarEdge",
    "Check Point", "Mobileye", "Gett", "Lemonade", "Via",
    "Payoneer", "Playtika", "AppsFlyer", "Lightricks",
    "Bizzabo", "Lusha", "Yotpo", "Riskified", "Forter",
    "Snyk", "Orca Security", "Transmit Security", "Cato Networks",
]

SERVICE_COMPANIES = [
    "Super-Pharm", "Castro", "Fox", "Shufersal", "Rami Levy",
    "Aroma Cafe", "Arcaffe", "Cofix", "Hotel Dan", "Isrotel",
    "Partner Communications", "Cellcom", "HOT", "Bezeq",
]

TECH_TITLES = [
    "Frontend Developer", "Backend Developer", "Full Stack Engineer",
    "React Developer", "Node.js Developer", "Python Developer",
    "DevOps Engineer", "QA Engineer", "Data Analyst", "Data Scientist",
    "Mobile Developer", "iOS Developer", "Android Developer",
    "UX Designer", "UI Developer", "Product Manager",
    "TypeScript Architect", "Cloud Engineer", "ML Engineer",
    "Security Engineer", "Site Reliability Engineer",
]

SERVICE_TITLES = [
    "Plumber", "Electrician", "House Cleaner", "Painter",
    "Moving Helper", "Delivery Driver", "Waiter", "Barista",
    "Chef", "Security Guard", "Receptionist", "Sales Associate",
    "Cashier", "Customer Support", "Office Manager",
    "Personal Trainer", "Dog Walker", "Babysitter",
    "Tutor", "Handyman",
]

TECH_SKILLS = [
    "React", "TypeScript", "JavaScript", "Node.js", "Python", "Go",
    "Java", "Kubernetes", "Docker", "AWS", "GCP", "Azure",
    "PostgreSQL", "MongoDB", "Redis", "GraphQL", "REST API",
    "Next.js", "Vue.js", "Angular", "Tailwind CSS", "CSS",
    "CI/CD", "Git", "Agile", "Scrum", "Figma",
    "React Native", "Swift", "Kotlin", "Flutter",
    "Machine Learning", "TensorFlow", "PyTorch",
]

SERVICE_SKILLS = [
    "Customer Service", "Hebrew", "English", "Russian", "Arabic",
    "Driving License", "First Aid", "Physical Fitness",
    "Communication", "Teamwork", "Reliability", "Flexibility",
    "Problem Solving", "Time Management", "Attention to Detail",
]

JOB_TYPES = ["full-time", "part-time", "contract", "gig"]

# ─── Stock images (Unsplash, free to use) ───────────────────────────────────

JOB_IMAGES = {
    # Tech / development
    "Frontend Developer": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=300&fit=crop",
    "Backend Developer": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=300&fit=crop",
    "Full Stack Engineer": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=300&fit=crop",
    "React Developer": "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=600&h=300&fit=crop",
    "Node.js Developer": "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=600&h=300&fit=crop",
    "Python Developer": "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600&h=300&fit=crop",
    "DevOps Engineer": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=300&fit=crop",
    "QA Engineer": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=300&fit=crop",
    "Data Analyst": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=300&fit=crop",
    "Data Scientist": "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&h=300&fit=crop",
    "Mobile Developer": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=300&fit=crop",
    "iOS Developer": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=300&fit=crop",
    "Android Developer": "https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?w=600&h=300&fit=crop",
    "UX Designer": "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=600&h=300&fit=crop",
    "UI Developer": "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=300&fit=crop",
    "Product Manager": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=300&fit=crop",
    "TypeScript Architect": "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=300&fit=crop",
    "Cloud Engineer": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&h=300&fit=crop",
    "ML Engineer": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=300&fit=crop",
    "Security Engineer": "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=600&h=300&fit=crop",
    "Site Reliability Engineer": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=300&fit=crop",
    # Service / blue-collar
    "Plumber": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&h=300&fit=crop",
    "Electrician": "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&h=300&fit=crop",
    "House Cleaner": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=300&fit=crop",
    "Painter": "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&h=300&fit=crop",
    "Moving Helper": "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=600&h=300&fit=crop",
    "Delivery Driver": "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&h=300&fit=crop",
    "Waiter": "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=300&fit=crop",
    "Barista": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=300&fit=crop",
    "Chef": "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=300&fit=crop",
    "Security Guard": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=300&fit=crop",
    "Receptionist": "https://images.unsplash.com/photo-1556745753-b2904692b3cd?w=600&h=300&fit=crop",
    "Sales Associate": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=300&fit=crop",
    "Cashier": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=300&fit=crop",
    "Customer Support": "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=300&fit=crop",
    "Office Manager": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=300&fit=crop",
    "Personal Trainer": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=300&fit=crop",
    "Dog Walker": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=300&fit=crop",
    "Babysitter": "https://images.unsplash.com/photo-1587654780291-39c9404d7dd0?w=600&h=300&fit=crop",
    "Tutor": "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&h=300&fit=crop",
    "Handyman": "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&h=300&fit=crop",
}

DEFAULT_JOB_IMAGE = "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=300&fit=crop"

PORTRAIT_PHOTOS = [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop&crop=face",
]


def seed_jobs(db, count=100):
    print(f"Seeding {count} jobs...")
    jobs = []
    for i in range(count):
        is_tech = random.random() < 0.6

        if is_tech:
            title = random.choice(TECH_TITLES)
            company = random.choice(TECH_COMPANIES)
            tags = random.sample(TECH_SKILLS, k=random.randint(2, 5))
            salary_min = random.choice([35, 40, 45, 50, 55, 60, 70, 80, 100])
            salary_max = salary_min + random.choice([0, 5, 10, 15, 20])
            job_type = random.choice(["full-time", "contract", "full-time", "full-time"])
        else:
            title = random.choice(SERVICE_TITLES)
            company = random.choice(SERVICE_COMPANIES)
            tags = random.sample(SERVICE_SKILLS, k=random.randint(2, 4))
            salary_min = random.choice([30, 33, 35, 38, 40, 42, 45])
            salary_max = salary_min + random.choice([0, 3, 5])
            job_type = random.choice(["part-time", "gig", "full-time", "contract"])

        city, lat, lng = random.choice(CITIES)
        lat += random.uniform(-0.02, 0.02)
        lng += random.uniform(-0.02, 0.02)

        desc_parts = [
            f"Join {company} as a {title} in {city}.",
            fake.sentence(nb_words=12),
            f"Requirements: {', '.join(tags[:3])}.",
        ]

        image = JOB_IMAGES.get(title, DEFAULT_JOB_IMAGE)

        job = Job(
            title=title,
            company=company,
            location=city,
            lat=round(lat, 4),
            lng=round(lng, 4),
            salary_min=salary_min,
            salary_max=salary_max,
            salary_currency="ILS",
            salary_period="hour",
            job_type=job_type,
            tags=tags,
            description=" ".join(desc_parts),
            image_url=image,
            source="parser",
            is_active=True,
        )
        jobs.append(job)
        db.add(job)

    db.commit()
    print(f"  Created {len(jobs)} jobs")
    return jobs


def seed_candidates(db, count=100):
    print(f"Seeding {count} candidates...")
    candidates = []
    for i in range(count):
        is_tech = random.random() < 0.6
        city, lat, lng = random.choice(CITIES)

        if is_tech:
            title = random.choice(TECH_TITLES)
            skills = random.sample(TECH_SKILLS, k=random.randint(3, 7))
            exp_years = random.randint(1, 15)
        else:
            title = random.choice(SERVICE_TITLES)
            skills = random.sample(SERVICE_SKILLS, k=random.randint(2, 5))
            exp_years = random.randint(0, 10)

        name = fake.name()
        is_newbie = random.random() < 0.2  # 20% newcomers

        # Trust score based on profile quality
        base_score = random.uniform(30, 95)
        if is_newbie:
            base_score = random.uniform(20, 60)

        photo = random.choice(PORTRAIT_PHOTOS)

        candidate = Candidate(
            name=name,
            title=title,
            location=city,
            lat=round(lat + random.uniform(-0.02, 0.02), 4),
            lng=round(lng + random.uniform(-0.02, 0.02), 4),
            skills=skills,
            experience_years=exp_years,
            about=f"{name} is a {title} with {exp_years} years of experience based in {city}. {fake.sentence()}",
            photo_url=photo,
            trust_score=round(base_score, 1),
            is_newbie=is_newbie,
            source="parser",
            is_active=True,
        )
        candidates.append(candidate)
        db.add(candidate)

    db.commit()
    print(f"  Created {len(candidates)} candidates ({sum(1 for c in candidates if c.is_newbie)} newbies)")
    return candidates


def seed_demo_users(db):
    """Create demo users for testing."""
    print("Seeding demo users...")

    # Demo worker
    worker = User(
        id="demo-worker",
        phone="+972501234567",
        name="Alex M.",
        email="alex@example.com",
        location="Tel Aviv",
        lat=32.0853,
        lng=34.7818,
        skills=["React", "TypeScript", "Node.js", "Python", "Docker"],
        title="Frontend Developer",
        about="Passionate frontend developer with expertise in React and TypeScript.",
        role="worker",
        plan="free",
    )
    db.merge(worker)

    # Demo employer
    employer = User(
        id="demo-employer",
        phone="+972509876543",
        name="TechCo HR",
        email="hr@techco.io",
        location="Tel Aviv",
        lat=32.0853,
        lng=34.7818,
        skills=[],
        title="HR Manager",
        role="employer",
        plan="employer_pro",
    )
    db.merge(employer)

    db.commit()
    print("  Created demo worker + employer")


def main():
    print("\n=== ATADA Database Seeder ===\n")

    # Create tables
    Base.metadata.create_all(bind=engine)
    print("Tables created.\n")

    db = SessionLocal()
    try:
        seed_demo_users(db)
        seed_jobs(db, 100)
        seed_candidates(db, 100)
        print("\nDone! Database seeded successfully.")
        print(f"Demo worker login: +972501234567")
        print(f"Demo employer login: +972509876543")
    finally:
        db.close()


if __name__ == "__main__":
    main()
