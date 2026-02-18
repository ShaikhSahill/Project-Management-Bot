"""
data_store.py - In-memory dummy data for AI service operations
This simulates having access to teams/projects data without needing MongoDB
"""

# Team members organized by team
TEAMS_DATA = {
    "frontend": {
        "display_name": "Frontend Team",
        "members": [
            {"name": "John Smith", "role": "lead", "skills": ["React", "TypeScript", "CSS", "Vue"], "workload": 3},
            {"name": "Sarah Johnson", "role": "developer", "skills": ["React", "JavaScript", "Tailwind"], "workload": 5},
            {"name": "Emily Davis", "role": "developer", "skills": ["Angular", "TypeScript", "SCSS"], "workload": 2},
            {"name": "Alex Chen", "role": "developer", "skills": ["React", "Next.js", "GraphQL"], "workload": 4},
        ]
    },
    "backend": {
        "display_name": "Backend Team",
        "members": [
            {"name": "Mike Wilson", "role": "lead", "skills": ["Node.js", "Python", "MongoDB", "PostgreSQL"], "workload": 4},
            {"name": "Tom Brown", "role": "developer", "skills": ["Java", "Spring Boot", "MySQL"], "workload": 3},
            {"name": "David Lee", "role": "developer", "skills": ["Node.js", "Express", "MongoDB"], "workload": 6},
            {"name": "Chris Taylor", "role": "developer", "skills": ["Python", "Django", "PostgreSQL"], "workload": 2},
        ]
    },
    "testing": {
        "display_name": "QA Testing Team",
        "members": [
            {"name": "Lisa Anderson", "role": "lead", "skills": ["Selenium", "Jest", "Cypress", "Manual Testing"], "workload": 3},
            {"name": "James Martinez", "role": "tester", "skills": ["Jest", "Mocha", "API Testing"], "workload": 4},
            {"name": "Rachel White", "role": "tester", "skills": ["Cypress", "Playwright", "E2E Testing"], "workload": 2},
        ]
    },
    "design": {
        "display_name": "Design Team",
        "members": [
            {"name": "Jessica Moore", "role": "lead", "skills": ["Figma", "UI/UX", "Adobe XD"], "workload": 2},
            {"name": "Kevin Clark", "role": "designer", "skills": ["Figma", "Illustrator", "Prototyping"], "workload": 3},
        ]
    },
    "devops": {
        "display_name": "DevOps Team",
        "members": [
            {"name": "Ryan Garcia", "role": "lead", "skills": ["AWS", "Docker", "Kubernetes", "CI/CD"], "workload": 5},
            {"name": "Amanda Hall", "role": "developer", "skills": ["Azure", "Terraform", "Jenkins"], "workload": 3},
        ]
    }
}

# Sample projects for demo
PROJECTS_DATA = {
    "project alpha": {
        "name": "Project Alpha",
        "description": "E-commerce platform redesign",
        "deadline": "2026-03-15",
        "status": "active",
        "total_tasks": 15,
        "completed_tasks": 6,
        "teams_involved": ["frontend", "backend", "testing"]
    },
    "project beta": {
        "name": "Project Beta",
        "description": "Internal analytics dashboard",
        "deadline": "2026-04-30",
        "status": "active",
        "total_tasks": 12,
        "completed_tasks": 8,
        "teams_involved": ["frontend", "backend", "design"]
    },
    "project gamma": {
        "name": "Project Gamma",
        "description": "Mobile app API",
        "deadline": "2026-02-28",
        "status": "active",
        "total_tasks": 18,
        "completed_tasks": 5,
        "teams_involved": ["backend", "testing", "devops"]
    },
    "project delta": {
        "name": "Project Delta",
        "description": "Customer support chatbot",
        "deadline": "2026-05-15",
        "status": "planning",
        "total_tasks": 0,
        "completed_tasks": 0,
        "teams_involved": []
    },
    "project a": {
        "name": "Project A",
        "description": "Demo project for testing",
        "deadline": "2026-03-01",
        "status": "active",
        "total_tasks": 10,
        "completed_tasks": 4,
        "teams_involved": ["frontend", "backend"]
    },
    "project b": {
        "name": "Project B",
        "description": "Another demo project",
        "deadline": "2026-04-01",
        "status": "planning",
        "total_tasks": 0,
        "completed_tasks": 0,
        "teams_involved": []
    }
}

# Keywords for intelligent task categorization
TASK_KEYWORDS = {
    "frontend": [
        "ui", "ux", "interface", "component", "react", "angular", "vue", "css", 
        "html", "layout", "responsive", "button", "form", "modal", "navigation",
        "page", "screen", "view", "style", "animation", "frontend", "front-end"
    ],
    "backend": [
        "api", "database", "server", "endpoint", "authentication", "auth",
        "middleware", "crud", "rest", "graphql", "query", "schema", "model",
        "controller", "service", "backend", "back-end", "logic", "data"
    ],
    "testing": [
        "test", "qa", "quality", "bug", "unit", "integration", "e2e", "selenium",
        "cypress", "jest", "validation", "verify", "testing", "coverage"
    ],
    "design": [
        "design", "mockup", "wireframe", "prototype", "figma", "sketch",
        "color", "typography", "icon", "asset", "visual", "branding"
    ],
    "devops": [
        "deploy", "deployment", "ci/cd", "pipeline", "docker", "kubernetes",
        "aws", "azure", "cloud", "infrastructure", "monitoring", "devops"
    ]
}


def get_all_team_members():
    """Returns a flat list of all team members with their team info"""
    members = []
    for team_name, team_data in TEAMS_DATA.items():
        for member in team_data["members"]:
            members.append({
                **member,
                "team": team_name,
                "team_display": team_data["display_name"]
            })
    return members


def find_member_by_name(name: str):
    """Find a team member by name (case-insensitive)"""
    name_lower = name.lower()
    for team_name, team_data in TEAMS_DATA.items():
        for member in team_data["members"]:
            if member["name"].lower() == name_lower or name_lower in member["name"].lower():
                return {**member, "team": team_name}
    return None


def get_team_members(team_name: str):
    """Get members of a specific team"""
    team = TEAMS_DATA.get(team_name.lower())
    if team:
        return team["members"]
    return []


def categorize_task_by_keywords(task_description: str) -> str:
    """Categorize a task based on keywords in its description"""
    desc_lower = task_description.lower()
    scores = {}
    
    for team, keywords in TASK_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in desc_lower)
        scores[team] = score
    
    if max(scores.values()) == 0:
        return "backend"  # Default category
    
    return max(scores, key=scores.get)


def get_members_with_lowest_workload(team_name: str, count: int = 1):
    """Get team members sorted by workload (lowest first)"""
    members = get_team_members(team_name)
    if not members:
        return []
    
    sorted_members = sorted(members, key=lambda m: m.get("workload", 0))
    return sorted_members[:count]
