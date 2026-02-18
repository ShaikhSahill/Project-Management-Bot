"""
main.py - FastAPI AI Service for Project Management Chatbot
Handles NLP processing, intent classification, and response generation with Gemini AI
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from nlp_processor import nlp_engine
from data_store import TEAMS_DATA, PROJECTS_DATA, get_all_team_members
from gemini_service import gemini_service
import uvicorn

app = FastAPI(
    title="Project Allocation AI Service",
    description="NLP-powered AI service with Gemini integration for intelligent project management",
    version="2.0.0"
)

# Add CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ Pydantic Models ============

class QueryRequest(BaseModel):
    query: str

class GeminiQueryRequest(BaseModel):
    query: str
    projects: List[Dict[str, Any]]
    teams: List[Dict[str, Any]]

class GenerateRequest(BaseModel):
    intent: str
    projectName: str
    stats: Dict[str, Any]

class TaskAssignmentRequest(BaseModel):
    projectName: str
    teams: List[Dict[str, Any]]

class ValidationRequest(BaseModel):
    totalTasks: int
    teams: List[Dict[str, Any]]


# ============ Routes ============

@app.get("/")
def home():
    """Health check endpoint"""
    return {
        "status": "AI Service Running",
        "version": "1.0.0",
        "endpoints": ["/analyze", "/generate", "/teams", "/validate", "/assign"]
    }


@app.get("/health")
def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "service": "ai-service",
        "gemini_enabled": gemini_service.is_configured,
        "capabilities": [
            "intent_classification",
            "entity_extraction",
            "status_generation",
            "task_distribution",
            "workload_balancing",
            "gemini_ai_responses"
        ]
    }


@app.post("/chat")
def gemini_chat(request: GeminiQueryRequest):
    """
    Main Gemini-powered chat endpoint.
    Receives user query along with full project and team context.
    Returns intelligent AI-generated response.
    """
    if not request.query or len(request.query.strip()) < 2:
        raise HTTPException(status_code=400, detail="Query too short")
    
    # Generate response using Gemini with full context
    response = gemini_service.generate_response(
        user_query=request.query,
        projects=request.projects,
        teams=request.teams
    )
    
    return {
        "reply": response,
        "gemini_enabled": gemini_service.is_configured
    }


@app.post("/analyze")
def analyze_query(request: QueryRequest):
    """
    Main NLP endpoint - Analyzes user query and returns intent + structured data.
    
    Handles:
    - Status queries: "What's the status of Project A?"
    - Creation queries: "Create Project B with 10 tasks..."
    - Team queries: "Who is on the frontend team?"
    - Help requests: "What can you do?"
    """
    if not request.query or len(request.query.strip()) < 2:
        raise HTTPException(status_code=400, detail="Query too short")
    
    result = nlp_engine.parse_query(request.query)
    return result


@app.post("/generate")
def generate_response(request: GenerateRequest):
    """
    Generates a natural language response based on provided project data/stats.
    Called by the backend after fetching actual project data from database.
    """
    response_text = nlp_engine.generate_status_response(request.dict())
    return {"reply": response_text}


@app.get("/teams")
def get_teams():
    """
    Returns all available teams and their members.
    Used for validation and auto-complete suggestions.
    """
    teams_summary = {}
    for name, data in TEAMS_DATA.items():
        teams_summary[name] = {
            "displayName": data["display_name"],
            "memberCount": len(data["members"]),
            "members": [
                {
                    "name": m["name"],
                    "role": m["role"],
                    "workload": m["workload"]
                }
                for m in data["members"]
            ]
        }
    return {"teams": teams_summary}


@app.get("/teams/{team_name}")
def get_team(team_name: str):
    """Get details of a specific team"""
    team_name_lower = team_name.lower()
    if team_name_lower not in TEAMS_DATA:
        raise HTTPException(
            status_code=404, 
            detail=f"Team '{team_name}' not found. Available: {list(TEAMS_DATA.keys())}"
        )
    
    team = TEAMS_DATA[team_name_lower]
    return {
        "name": team_name_lower,
        "displayName": team["display_name"],
        "members": team["members"]
    }


@app.get("/members")
def get_all_members():
    """Get all team members across all teams"""
    members = get_all_team_members()
    return {"members": members, "count": len(members)}


@app.post("/validate")
def validate_task_distribution(request: ValidationRequest):
    """
    Validates task distribution before creation.
    Checks:
    - Math matches (sum of team tasks = total)
    - Team names are valid
    - Members exist in teams
    """
    errors = []
    warnings = []
    
    # Calculate total from teams
    calculated_total = sum(team.get("count", 0) for team in request.teams)
    
    # Check math
    if calculated_total != request.totalTasks:
        errors.append({
            "type": "math_mismatch",
            "message": f"Total tasks ({request.totalTasks}) doesn't match sum of team assignments ({calculated_total})"
        })
    
    # Validate teams and members
    for team in request.teams:
        team_name = team.get("name", "").lower()
        
        if team_name not in TEAMS_DATA:
            errors.append({
                "type": "invalid_team",
                "message": f"Team '{team_name}' not found"
            })
            continue
        
        # Check if assigned members are in the team
        team_data = TEAMS_DATA[team_name]
        team_member_names = [m["name"].lower() for m in team_data["members"]]
        
        for member in team.get("members", []):
            if member.lower() not in team_member_names:
                warnings.append({
                    "type": "member_not_in_team",
                    "message": f"'{member}' not found in {team_name} team"
                })
    
    is_valid = len(errors) == 0
    
    return {
        "valid": is_valid,
        "errors": errors,
        "warnings": warnings,
        "summary": {
            "totalTasks": request.totalTasks,
            "calculatedTotal": calculated_total,
            "teamsCount": len(request.teams)
        }
    }


@app.post("/assign")
def generate_task_assignments(request: TaskAssignmentRequest):
    """
    Generates smart task assignments based on team allocation and workload.
    Returns structured task data ready for database insertion.
    """
    tasks = nlp_engine.generate_task_assignments(
        request.projectName,
        request.teams
    )
    
    return {
        "projectName": request.projectName,
        "tasks": tasks,
        "count": len(tasks),
        "distribution": {
            team["name"]: team["count"] 
            for team in request.teams
        }
    }


@app.get("/projects")
def get_demo_projects():
    """
    Returns demo project data for testing.
    In production, this would come from the actual database.
    """
    return {"projects": PROJECTS_DATA}


@app.get("/projects/{project_name}")
def get_project(project_name: str):
    """Get details of a specific demo project"""
    project_key = project_name.lower()
    
    # Try exact match first
    if project_key in PROJECTS_DATA:
        return {"project": PROJECTS_DATA[project_key]}
    
    # Try partial match
    for key, project in PROJECTS_DATA.items():
        if project_name.lower() in key or project_key in project["name"].lower():
            return {"project": project}
    
    raise HTTPException(
        status_code=404,
        detail=f"Project '{project_name}' not found"
    )


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
