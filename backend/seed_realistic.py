"""
ATADA — Realistic Database Seeder
50 hand-crafted jobs that look like real Israeli job listings.
Run: python seed_realistic.py
"""

import random
from datetime import datetime, timezone, timedelta
from app.db.database import engine, SessionLocal, Base
from app.domain.models import Job, Candidate, User

# ─── 50 realistic Israeli jobs ──────────────────────────────────────────────

JOBS = [
    # --- Tech: Frontend / React ---
    {
        "title": "Senior React Developer",
        "company": "Wix",
        "location": "Tel Aviv",
        "lat": 32.0853, "lng": 34.7818,
        "salary_min": 55, "salary_max": 70,
        "job_type": "full-time",
        "tags": ["React", "TypeScript", "Next.js", "GraphQL"],
        "description": "Build and maintain high-traffic web applications serving millions of users. You'll work on Wix's core editor team, shipping features used by creators worldwide. Strong React and TypeScript skills required. Hybrid model — 3 days in office.",
        "image_url": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=300&fit=crop",
    },
    {
        "title": "Frontend Developer",
        "company": "Monday.com",
        "location": "Tel Aviv",
        "lat": 32.0700, "lng": 34.7900,
        "salary_min": 45, "salary_max": 60,
        "job_type": "full-time",
        "tags": ["React", "CSS", "Design Systems", "Figma"],
        "description": "Join our Design Systems team to build reusable components used across all Monday.com products. You'll bridge design and engineering, ensuring pixel-perfect implementation. 2+ years React experience.",
        "image_url": "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=600&h=300&fit=crop",
    },
    {
        "title": "Full Stack Engineer",
        "company": "Fiverr",
        "location": "Tel Aviv",
        "lat": 32.0630, "lng": 34.7710,
        "salary_min": 50, "salary_max": 65,
        "job_type": "full-time",
        "tags": ["Node.js", "React", "PostgreSQL", "AWS"],
        "description": "Own features end-to-end on a marketplace used by 4M+ freelancers. Fast-paced environment with high ownership. You'll ship code to production daily. Node.js + React stack.",
        "image_url": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=300&fit=crop",
    },
    {
        "title": "React Native Developer",
        "company": "Rapyd",
        "location": "Tel Aviv",
        "lat": 32.0750, "lng": 34.7850,
        "salary_min": 50, "salary_max": 60,
        "job_type": "contract",
        "tags": ["React Native", "TypeScript", "Mobile", "Fintech"],
        "description": "Develop cross-platform mobile payment flows for Rapyd's global fintech platform. You'll work on SDK integrations and merchant-facing apps. 3+ years mobile experience required.",
        "image_url": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=300&fit=crop",
    },
    {
        "title": "TypeScript Architect",
        "company": "JFrog",
        "location": "Netanya",
        "lat": 32.3215, "lng": 34.8532,
        "salary_min": 70, "salary_max": 90,
        "job_type": "full-time",
        "tags": ["TypeScript", "Architecture", "DevTools", "CI/CD"],
        "description": "Lead TypeScript architecture for JFrog's developer tooling products. Define patterns, mentor engineers, and drive technical strategy across 3 product teams. 5+ years experience.",
        "image_url": "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=300&fit=crop",
    },
    # --- Tech: Backend / DevOps ---
    {
        "title": "Python Backend Developer",
        "company": "AppsFlyer",
        "location": "Herzliya",
        "lat": 32.1629, "lng": 34.8443,
        "salary_min": 55, "salary_max": 70,
        "job_type": "full-time",
        "tags": ["Python", "FastAPI", "Redis", "Kafka"],
        "description": "Build high-throughput data pipelines processing billions of events daily. You'll work with Python, FastAPI, and distributed systems. Experience with event-driven architecture is a plus.",
        "image_url": "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600&h=300&fit=crop",
    },
    {
        "title": "DevOps Engineer",
        "company": "CyberArk",
        "location": "Petah Tikva",
        "lat": 32.0868, "lng": 34.8876,
        "salary_min": 55, "salary_max": 75,
        "job_type": "full-time",
        "tags": ["Kubernetes", "AWS", "Terraform", "CI/CD"],
        "description": "Manage and scale cloud infrastructure for CyberArk's security platform. Kubernetes, AWS, and Terraform daily. On-call rotation required. Competitive salary + RSUs.",
        "image_url": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=300&fit=crop",
    },
    {
        "title": "Cloud Engineer",
        "company": "Check Point",
        "location": "Tel Aviv",
        "lat": 32.0900, "lng": 34.7750,
        "salary_min": 60, "salary_max": 80,
        "job_type": "full-time",
        "tags": ["AWS", "GCP", "Docker", "Python"],
        "description": "Design and implement cloud security solutions for Check Point's next-gen firewall. Multi-cloud experience (AWS + GCP) required. Work with a team of 8 engineers.",
        "image_url": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&h=300&fit=crop",
    },
    {
        "title": "QA Automation Engineer",
        "company": "Playtika",
        "location": "Herzliya",
        "lat": 32.1600, "lng": 34.8400,
        "salary_min": 40, "salary_max": 55,
        "job_type": "full-time",
        "tags": ["Selenium", "Python", "CI/CD", "API Testing"],
        "description": "Build and maintain automated test suites for Playtika's gaming platform. You'll work across web and mobile, writing Selenium and API tests. 2+ years QA automation experience.",
        "image_url": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=300&fit=crop",
    },
    {
        "title": "Data Analyst",
        "company": "Lemonade",
        "location": "Tel Aviv",
        "lat": 32.0800, "lng": 34.7800,
        "salary_min": 45, "salary_max": 60,
        "job_type": "full-time",
        "tags": ["SQL", "Python", "Tableau", "Statistics"],
        "description": "Analyze insurance claims data to identify patterns and improve pricing models. SQL fluency required, Python for modeling. You'll present findings directly to leadership.",
        "image_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=300&fit=crop",
    },
    # --- Tech: Design / Product ---
    {
        "title": "UX Designer",
        "company": "Lightricks",
        "location": "Jerusalem",
        "lat": 31.7683, "lng": 35.2137,
        "salary_min": 45, "salary_max": 60,
        "job_type": "full-time",
        "tags": ["Figma", "User Research", "Prototyping", "Mobile"],
        "description": "Design mobile-first creative tools used by millions. You'll run user research, create prototypes, and ship designs for Facetune and Videoleap. Portfolio required.",
        "image_url": "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=600&h=300&fit=crop",
    },
    {
        "title": "Product Manager",
        "company": "Gett",
        "location": "Tel Aviv",
        "lat": 32.0750, "lng": 34.7900,
        "salary_min": 60, "salary_max": 80,
        "job_type": "full-time",
        "tags": ["Product Strategy", "Analytics", "Agile", "B2B"],
        "description": "Own the rider experience for Gett's corporate mobility platform. Data-driven product decisions, A/B testing, and stakeholder management. 3+ years PM experience required.",
        "image_url": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=300&fit=crop",
    },
    # --- Tech: More roles ---
    {
        "title": "ML Engineer",
        "company": "Mobileye",
        "location": "Jerusalem",
        "lat": 31.7700, "lng": 35.2100,
        "salary_min": 70, "salary_max": 100,
        "job_type": "full-time",
        "tags": ["PyTorch", "Computer Vision", "C++", "CUDA"],
        "description": "Develop machine learning models for autonomous driving. You'll work on real-time object detection and path planning. PhD or 3+ years ML production experience required.",
        "image_url": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=300&fit=crop",
    },
    {
        "title": "Security Researcher",
        "company": "Snyk",
        "location": "Tel Aviv",
        "lat": 32.0850, "lng": 34.7800,
        "salary_min": 60, "salary_max": 80,
        "job_type": "full-time",
        "tags": ["Security", "Python", "Vulnerabilities", "Open Source"],
        "description": "Research and discover vulnerabilities in open-source packages. Write security advisories and build detection tools. Deep understanding of application security required.",
        "image_url": "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=600&h=300&fit=crop",
    },
    {
        "title": "iOS Developer",
        "company": "Yotpo",
        "location": "Tel Aviv",
        "lat": 32.0820, "lng": 34.7850,
        "salary_min": 50, "salary_max": 65,
        "job_type": "full-time",
        "tags": ["Swift", "SwiftUI", "iOS", "REST API"],
        "description": "Build native iOS features for Yotpo's eCommerce review platform. SwiftUI for new screens, UIKit maintenance. App Store experience required. Hybrid — 2 days WFH.",
        "image_url": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=300&fit=crop",
    },
    # --- Service: Restaurant / Food ---
    {
        "title": "Barista",
        "company": "Aroma Espresso Bar",
        "location": "Tel Aviv",
        "lat": 32.0750, "lng": 34.7750,
        "salary_min": 32, "salary_max": 38,
        "job_type": "part-time",
        "tags": ["Coffee", "Customer Service", "Hebrew", "English"],
        "description": "Make exceptional coffee at one of Israel's most loved cafe chains. Morning shifts available (6am-2pm). Experience preferred but we'll train the right person. Meal included.",
        "image_url": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=300&fit=crop",
    },
    {
        "title": "Head Chef",
        "company": "Hotel Dan Panorama",
        "location": "Tel Aviv",
        "lat": 32.0680, "lng": 34.7650,
        "salary_min": 55, "salary_max": 70,
        "job_type": "full-time",
        "tags": ["Cooking", "Team Management", "Menu Planning", "Kosher"],
        "description": "Lead the kitchen team at Dan Panorama's main restaurant. 250+ covers per night. Menu development, cost control, and team of 12 cooks. 5+ years head chef experience. Kosher kitchen knowledge essential.",
        "image_url": "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=300&fit=crop",
    },
    {
        "title": "Waiter / Waitress",
        "company": "Arcaffe",
        "location": "Ramat Gan",
        "lat": 32.0680, "lng": 34.8248,
        "salary_min": 30, "salary_max": 35,
        "job_type": "part-time",
        "tags": ["Customer Service", "Hebrew", "English", "Flexibility"],
        "description": "Join our team at Arcaffe Ramat Gan. Evening shifts (4pm-midnight), weekends required. Tips on top of hourly rate. Hebrew fluency required, English a plus.",
        "image_url": "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=300&fit=crop",
    },
    # --- Service: Trades ---
    {
        "title": "Licensed Electrician",
        "company": "Bezeq",
        "location": "Haifa",
        "lat": 32.7940, "lng": 34.9896,
        "salary_min": 45, "salary_max": 55,
        "job_type": "full-time",
        "tags": ["Electrical", "Licensed", "Driving License", "Hebrew"],
        "description": "Install and maintain telecom infrastructure across the Haifa district. Israeli electrician license required. Company vehicle provided. Mon-Thu + half Friday.",
        "image_url": "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&h=300&fit=crop",
    },
    {
        "title": "Plumber",
        "company": "Fix It Israel",
        "location": "Tel Aviv",
        "lat": 32.0800, "lng": 34.7750,
        "salary_min": 40, "salary_max": 55,
        "job_type": "contract",
        "tags": ["Plumbing", "Driving License", "Tools", "Hebrew"],
        "description": "Residential and commercial plumbing jobs across Gush Dan. Flexible schedule — you choose your hours. Own tools preferred. We provide the clients and handle billing.",
        "image_url": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&h=300&fit=crop",
    },
    {
        "title": "House Painter",
        "company": "ColorHome",
        "location": "Rishon LeZion",
        "lat": 31.9730, "lng": 34.7925,
        "salary_min": 35, "salary_max": 45,
        "job_type": "gig",
        "tags": ["Painting", "Physical Fitness", "Reliability", "Hebrew"],
        "description": "Interior and exterior painting for residential clients. Payment per project (average 2-3 days per apartment). Experience with Israeli housing standards. Tools provided.",
        "image_url": "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&h=300&fit=crop",
    },
    # --- Service: Delivery / Logistics ---
    {
        "title": "Delivery Driver",
        "company": "Wolt",
        "location": "Tel Aviv",
        "lat": 32.0750, "lng": 34.7800,
        "salary_min": 30, "salary_max": 45,
        "job_type": "gig",
        "tags": ["Driving License", "Scooter", "Flexibility", "English"],
        "description": "Deliver food and groceries across Tel Aviv. Use your own scooter or bicycle. Flexible hours — work when you want. Average 30-45 ILS/hr including tips. App-based.",
        "image_url": "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&h=300&fit=crop",
    },
    {
        "title": "Moving Helper",
        "company": "Mover IL",
        "location": "Tel Aviv",
        "lat": 32.0650, "lng": 34.7800,
        "salary_min": 35, "salary_max": 40,
        "job_type": "gig",
        "tags": ["Physical Fitness", "Driving License", "Teamwork", "Hebrew"],
        "description": "Help families and offices move across Israel. Physical work — lifting furniture, packing. Daily assignments, paid same day. Truck driving license a big plus.",
        "image_url": "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=600&h=300&fit=crop",
    },
    # --- Service: Security / Office ---
    {
        "title": "Security Guard",
        "company": "Hashmira",
        "location": "Jerusalem",
        "lat": 31.7700, "lng": 35.2150,
        "salary_min": 33, "salary_max": 38,
        "job_type": "full-time",
        "tags": ["Security", "Hebrew", "First Aid", "Reliability"],
        "description": "Guard commercial buildings in Jerusalem center. 8-hour shifts (day or night available). Valid security guard license required. First aid certification a plus.",
        "image_url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=300&fit=crop",
    },
    {
        "title": "Receptionist",
        "company": "WeWork",
        "location": "Tel Aviv",
        "lat": 32.0730, "lng": 34.7920,
        "salary_min": 35, "salary_max": 42,
        "job_type": "full-time",
        "tags": ["Customer Service", "English", "Hebrew", "Communication"],
        "description": "Be the face of WeWork's Sarona campus. Greet members, manage meeting rooms, handle packages. Fluent English and Hebrew. Sun-Thu, 8am-5pm. Great vibe.",
        "image_url": "https://images.unsplash.com/photo-1556745753-b2904692b3cd?w=600&h=300&fit=crop",
    },
    {
        "title": "Office Manager",
        "company": "Riskified",
        "location": "Tel Aviv",
        "lat": 32.0780, "lng": 34.7830,
        "salary_min": 40, "salary_max": 50,
        "job_type": "full-time",
        "tags": ["Office Management", "Communication", "Excel", "Hebrew"],
        "description": "Run the day-to-day operations of Riskified's TLV HQ (200 employees). Vendor management, events, office supplies, and team happiness. Organizational skills are everything.",
        "image_url": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=300&fit=crop",
    },
    # --- Service: Personal / Care ---
    {
        "title": "Personal Trainer",
        "company": "Holmes Place",
        "location": "Herzliya",
        "lat": 32.1650, "lng": 34.8450,
        "salary_min": 40, "salary_max": 60,
        "job_type": "part-time",
        "tags": ["Fitness", "Certification", "Communication", "English"],
        "description": "Train clients 1-on-1 at Holmes Place Herzliya. Certified trainers only. Build your client base — we provide the facility and initial leads. Flexible schedule.",
        "image_url": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=300&fit=crop",
    },
    {
        "title": "Dog Walker",
        "company": "DogBuddy IL",
        "location": "Tel Aviv",
        "lat": 32.0850, "lng": 34.7750,
        "salary_min": 30, "salary_max": 40,
        "job_type": "gig",
        "tags": ["Animal Care", "Flexibility", "Reliability", "Physical Fitness"],
        "description": "Walk dogs in the Tel Aviv/Jaffa area. 30-60 min walks, multiple dogs per session. You pick your hours and area. Average 3-5 walks per day. Love dogs? This is for you.",
        "image_url": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=300&fit=crop",
    },
    {
        "title": "Babysitter",
        "company": "SitterPro",
        "location": "Raanana",
        "lat": 32.1839, "lng": 34.8710,
        "salary_min": 35, "salary_max": 45,
        "job_type": "part-time",
        "tags": ["Childcare", "First Aid", "Hebrew", "English"],
        "description": "Babysit for families in Raanana and Kfar Saba. After-school hours (3pm-8pm) most common. First aid certification required. Background check provided by us.",
        "image_url": "https://images.unsplash.com/photo-1587654780291-39c9404d7dd0?w=600&h=300&fit=crop",
    },
    {
        "title": "Math Tutor",
        "company": "Tutors Hub",
        "location": "Rehovot",
        "lat": 31.8928, "lng": 34.8077,
        "salary_min": 50, "salary_max": 80,
        "job_type": "part-time",
        "tags": ["Mathematics", "Teaching", "Hebrew", "Patience"],
        "description": "Tutor high school students for Bagrut exams (5 units math). In-person at students' homes in Rehovot area. Evening hours. Math degree or teaching certification required.",
        "image_url": "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&h=300&fit=crop",
    },
    # --- More tech ---
    {
        "title": "Android Developer",
        "company": "Taboola",
        "location": "Tel Aviv",
        "lat": 32.0700, "lng": 34.7850,
        "salary_min": 50, "salary_max": 65,
        "job_type": "full-time",
        "tags": ["Kotlin", "Android", "Jetpack Compose", "REST API"],
        "description": "Build Taboola's SDK used by top publishers worldwide. Kotlin, Jetpack Compose, and modern Android architecture. Performance optimization is key — our SDK runs on millions of devices.",
        "image_url": "https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?w=600&h=300&fit=crop",
    },
    {
        "title": "UI Developer",
        "company": "Elementor",
        "location": "Tel Aviv",
        "lat": 32.0820, "lng": 34.7900,
        "salary_min": 40, "salary_max": 55,
        "job_type": "full-time",
        "tags": ["CSS", "React", "WordPress", "Responsive Design"],
        "description": "Build pixel-perfect UI for the world's most popular website builder. You'll work on the drag-and-drop editor used by 15M+ websites. Deep CSS knowledge required.",
        "image_url": "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=300&fit=crop",
    },
    {
        "title": "Backend Developer (Go)",
        "company": "Orca Security",
        "location": "Tel Aviv",
        "lat": 32.0780, "lng": 34.7830,
        "salary_min": 60, "salary_max": 80,
        "job_type": "full-time",
        "tags": ["Go", "Cloud Security", "AWS", "Microservices"],
        "description": "Build cloud security scanning infrastructure at scale. Go services processing petabytes of cloud data. AWS expertise required. Competitive compensation package.",
        "image_url": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=300&fit=crop",
    },
    # --- Retail / Sales ---
    {
        "title": "Sales Associate",
        "company": "Castro",
        "location": "Ramat Gan",
        "lat": 32.0680, "lng": 34.8200,
        "salary_min": 30, "salary_max": 35,
        "job_type": "part-time",
        "tags": ["Retail", "Hebrew", "Customer Service", "Fashion"],
        "description": "Join Castro's Ayalon Mall store. Help customers find their style, manage inventory, and keep the store looking great. Shifts: evenings and weekends. Staff discount.",
        "image_url": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=300&fit=crop",
    },
    {
        "title": "Cashier",
        "company": "Shufersal",
        "location": "Holon",
        "lat": 32.0116, "lng": 34.7748,
        "salary_min": 30, "salary_max": 33,
        "job_type": "part-time",
        "tags": ["Retail", "Hebrew", "Customer Service", "Reliability"],
        "description": "Cashier at Shufersal Deal Holon. Morning or evening shifts available. Fast-paced environment, friendly team. No experience needed — full training provided.",
        "image_url": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=300&fit=crop",
    },
    {
        "title": "Customer Support Agent",
        "company": "Partner Communications",
        "location": "Netanya",
        "lat": 32.3215, "lng": 34.8532,
        "salary_min": 33, "salary_max": 40,
        "job_type": "full-time",
        "tags": ["Customer Support", "Hebrew", "CRM", "Problem Solving"],
        "description": "Handle customer calls and chats for Israel's leading telecom provider. Resolve billing, technical, and service issues. Full training program. Career growth path to team lead.",
        "image_url": "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=300&fit=crop",
    },
    # --- More tech roles ---
    {
        "title": "Site Reliability Engineer",
        "company": "Payoneer",
        "location": "Petah Tikva",
        "lat": 32.0868, "lng": 34.8876,
        "salary_min": 60, "salary_max": 80,
        "job_type": "full-time",
        "tags": ["Linux", "Kubernetes", "Monitoring", "Python"],
        "description": "Keep Payoneer's payment platform running at 99.99% uptime. Incident response, capacity planning, and automation. On-call rotation (1 week per month). Strong Linux skills.",
        "image_url": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=300&fit=crop",
    },
    {
        "title": "Data Scientist",
        "company": "SolarEdge",
        "location": "Herzliya",
        "lat": 32.1600, "lng": 34.8400,
        "salary_min": 55, "salary_max": 75,
        "job_type": "full-time",
        "tags": ["Python", "Machine Learning", "Solar Energy", "Statistics"],
        "description": "Build predictive models for solar energy optimization. Analyze performance data from millions of solar installations worldwide. Python, scikit-learn, and time series experience required.",
        "image_url": "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&h=300&fit=crop",
    },
    {
        "title": "Vue.js Developer",
        "company": "ironSource",
        "location": "Tel Aviv",
        "lat": 32.0730, "lng": 34.7900,
        "salary_min": 45, "salary_max": 60,
        "job_type": "full-time",
        "tags": ["Vue.js", "TypeScript", "REST API", "Tailwind"],
        "description": "Build dashboards and analytics tools for Unity's ad monetization platform. Vue 3 + TypeScript stack. Data-heavy interfaces with real-time updates. 2+ years Vue experience.",
        "image_url": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=300&fit=crop",
    },
    # --- Service: Handyman / Construction ---
    {
        "title": "Handyman",
        "company": "TaskRabbit IL",
        "location": "Tel Aviv",
        "lat": 32.0700, "lng": 34.7800,
        "salary_min": 40, "salary_max": 60,
        "job_type": "gig",
        "tags": ["Repairs", "Tools", "Flexibility", "Driving License"],
        "description": "Fix things in people's homes — furniture assembly, shelf mounting, minor plumbing, painting. Set your own rates and hours. Own tools required. Rating-based platform.",
        "image_url": "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&h=300&fit=crop",
    },
    # --- More mixed ---
    {
        "title": "Node.js Developer",
        "company": "Forter",
        "location": "Tel Aviv",
        "lat": 32.0780, "lng": 34.7830,
        "salary_min": 50, "salary_max": 65,
        "job_type": "full-time",
        "tags": ["Node.js", "TypeScript", "MongoDB", "Microservices"],
        "description": "Build real-time fraud detection APIs handling thousands of requests per second. Node.js microservices, MongoDB, and event-driven architecture. Fast-paced startup environment.",
        "image_url": "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=600&h=300&fit=crop",
    },
    {
        "title": "Graphic Designer",
        "company": "Outbrain",
        "location": "Netanya",
        "lat": 32.3200, "lng": 34.8500,
        "salary_min": 38, "salary_max": 50,
        "job_type": "full-time",
        "tags": ["Photoshop", "Illustrator", "Figma", "Branding"],
        "description": "Create visual content for Outbrain's marketing and product teams. Ad creatives, landing pages, social media assets, and brand materials. Adobe suite + Figma fluency required.",
        "image_url": "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=600&h=300&fit=crop",
    },
    {
        "title": "Marketing Manager",
        "company": "Bizzabo",
        "location": "Tel Aviv",
        "lat": 32.0750, "lng": 34.7850,
        "salary_min": 50, "salary_max": 70,
        "job_type": "full-time",
        "tags": ["Marketing", "Content", "Analytics", "B2B SaaS"],
        "description": "Lead demand generation for Bizzabo's event management platform. Content strategy, paid campaigns, and marketing analytics. B2B SaaS experience required. Remote-friendly.",
        "image_url": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=300&fit=crop",
    },
    {
        "title": "Barista",
        "company": "Cofix",
        "location": "Bnei Brak",
        "lat": 32.0834, "lng": 34.8339,
        "salary_min": 30, "salary_max": 33,
        "job_type": "part-time",
        "tags": ["Coffee", "Customer Service", "Hebrew", "Speed"],
        "description": "Fast-paced coffee making at Cofix — everything for 5 shekels. Morning shifts, high volume. No experience needed, we train. Fun team and free coffee all day.",
        "image_url": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=300&fit=crop",
    },
    {
        "title": "Delivery Courier (Bicycle)",
        "company": "Wolt",
        "location": "Jerusalem",
        "lat": 31.7700, "lng": 35.2100,
        "salary_min": 28, "salary_max": 40,
        "job_type": "gig",
        "tags": ["Bicycle", "Flexibility", "Navigation", "Physical Fitness"],
        "description": "Deliver food by bicycle in Jerusalem. Perfect for students — work between classes. Own bicycle required. Earn 28-40 ILS/hr depending on distance and tips.",
        "image_url": "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&h=300&fit=crop",
    },
    {
        "title": "Frontend Team Lead",
        "company": "Cato Networks",
        "location": "Tel Aviv",
        "lat": 32.0800, "lng": 34.7850,
        "salary_min": 75, "salary_max": 95,
        "job_type": "full-time",
        "tags": ["React", "Team Lead", "Architecture", "Mentoring"],
        "description": "Lead a team of 6 frontend engineers building Cato's SASE management console. Code 50%, manage 50%. React, state management, and performance optimization. 3+ years leading teams.",
        "image_url": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=300&fit=crop",
    },
    {
        "title": "Night Shift Security",
        "company": "Mikud Security",
        "location": "Ashdod",
        "lat": 31.8014, "lng": 34.6434,
        "salary_min": 35, "salary_max": 42,
        "job_type": "full-time",
        "tags": ["Security", "Night Shift", "Hebrew", "Alertness"],
        "description": "Night shift security at Ashdod industrial zone. 10pm-6am, 5 nights per week. Valid security license required. Night premium included in hourly rate.",
        "image_url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=300&fit=crop",
    },
]

# Portraits for candidates
PORTRAITS = [
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
]

CANDIDATE_NAMES = [
    "Daniel Cohen", "Maya Levy", "Noam Ben-David", "Yael Shapira",
    "Omer Goldstein", "Shira Friedman", "Liam Rosenberg", "Noa Alon",
    "Eitan Katz", "Tamar Weiss", "Ariel Mizrahi", "Hila Stern",
    "Rotem Avraham", "Guy Peretz", "Michal Carmi", "Ido Nachman",
    "Inbar Segal", "Amir Dayan", "Liora Epstein", "Yonatan Barak",
]

CANDIDATE_TITLES = [
    "React Developer", "Full Stack Engineer", "DevOps Engineer",
    "UX Designer", "Data Analyst", "QA Engineer",
    "Barista", "Chef", "Security Guard", "Personal Trainer",
    "Electrician", "Delivery Driver", "Sales Associate",
    "Office Manager", "Customer Support Specialist",
]


def main():
    print("\n=== ATADA Realistic Seeder ===\n")

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Clear old data
        from app.domain.models import Match, Application
        db.query(Match).delete()
        db.query(Application).delete()
        db.query(Job).delete()
        db.query(Candidate).delete()
        db.commit()
        print("Cleared old data.\n")

        # Demo users
        worker = User(
            id="demo-worker", phone="+972501234567", name="Alex M.",
            email="alex@example.com", location="Tel Aviv",
            lat=32.0853, lng=34.7818,
            skills=["React", "TypeScript", "Node.js", "Python", "Docker"],
            title="Frontend Developer",
            about="Passionate frontend developer with expertise in React and TypeScript.",
            role="worker", plan="free",
        )
        db.merge(worker)

        employer = User(
            id="demo-employer", phone="+972509876543", name="TechCo HR",
            email="hr@techco.io", location="Tel Aviv",
            lat=32.0853, lng=34.7818,
            skills=[], title="HR Manager", role="employer", plan="employer_pro",
        )
        db.merge(employer)
        db.commit()
        print("Demo users ready.\n")

        # Seed jobs
        print(f"Seeding {len(JOBS)} realistic jobs...")
        for j in JOBS:
            posted = datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 72))
            job = Job(
                title=j["title"], company=j["company"], location=j["location"],
                lat=j["lat"], lng=j["lng"],
                salary_min=j["salary_min"], salary_max=j["salary_max"],
                salary_currency="ILS", salary_period="hour",
                job_type=j["job_type"], tags=j["tags"],
                description=j["description"], image_url=j["image_url"],
                source="parser", is_active=True, posted_at=posted,
            )
            db.add(job)
        db.commit()
        print(f"  {len(JOBS)} jobs created.\n")

        # Seed candidates
        print("Seeding 20 candidates...")
        for i, name in enumerate(CANDIDATE_NAMES):
            title = CANDIDATE_TITLES[i % len(CANDIDATE_TITLES)]
            city = random.choice(["Tel Aviv", "Herzliya", "Ramat Gan", "Jerusalem", "Haifa"])
            skills = random.sample(
                ["React", "TypeScript", "Python", "Node.js", "AWS", "Docker", "Figma",
                 "Hebrew", "English", "Customer Service", "Communication", "Excel"],
                k=random.randint(3, 6)
            )
            c = Candidate(
                name=name, title=title, location=city,
                skills=skills, experience_years=random.randint(1, 12),
                about=f"{name} is a {title} based in {city} with {random.randint(1,10)} years of experience.",
                photo_url=PORTRAITS[i % len(PORTRAITS)],
                trust_score=round(random.uniform(40, 95), 1),
                is_newbie=(i >= 16), is_active=True, source="parser",
            )
            db.add(c)
        db.commit()
        print("  20 candidates created.\n")

        print("Done! Realistic data seeded.")
        print("Demo worker: +972501234567")
        print("Demo employer: +972509876543\n")

    finally:
        db.close()


if __name__ == "__main__":
    main()
