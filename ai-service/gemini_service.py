"""
gemini_service.py - Google Gemini AI Integration for Intelligent Project Management
Provides context-aware responses using real project and team data
"""
import os
import google.generativeai as genai
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

class GeminiService:
    def __init__(self):
        self.model = None
        self.is_configured = False
        
        if GEMINI_API_KEY:
            try:
                genai.configure(api_key=GEMINI_API_KEY)
                self.model = genai.GenerativeModel('gemini-2.5-flash')
                self.is_configured = True
                print("✅ Gemini API configured successfully")
            except Exception as e:
                print(f"⚠️ Gemini API configuration failed: {e}")
        else:
            print("⚠️ GEMINI_API_KEY not found in environment. Using fallback responses.")

    def build_context(self, projects: List[Dict], teams: List[Dict]) -> str:
        """Build a comprehensive context string from project and team data"""
        
        context_parts = []
        
        # Projects Summary
        context_parts.append("=== CURRENT PROJECTS ===")
        if not projects:
            context_parts.append("No projects found in the system.")
        else:
            for proj in projects:
                status_emoji = {"active": "🟢", "completed": "✅", "on-hold": "🟡", "planning": "📋"}.get(proj.get("status", ""), "⚪")
                total = proj.get("totalTasks", 0)
                completed = proj.get("completedTasks", 0)
                in_progress = proj.get("inProgressTasks", 0)
                pending = proj.get("pendingTasks", 0)
                progress = round((completed / total * 100), 1) if total > 0 else 0
                
                deadline_str = proj.get("deadline", "Not set")
                if deadline_str and deadline_str != "Not set":
                    deadline_str = deadline_str.split("T")[0] if "T" in deadline_str else deadline_str
                
                context_parts.append(f"""
Project: {proj.get('name', 'Unknown')}
  - Status: {status_emoji} {proj.get('status', 'unknown')}
  - Progress: {progress}% ({completed}/{total} tasks completed)
  - Tasks Breakdown: {completed} completed, {in_progress} in progress, {pending} pending
  - Deadline: {deadline_str}
  - Assigned Team: {proj.get('assignedTeam', 'Not assigned')}""")
        
        # Teams Summary
        context_parts.append("\n=== TEAMS & MEMBERS ===")
        if not teams:
            context_parts.append("No teams found in the system.")
        else:
            for team in teams:
                members = team.get("members", [])
                total_workload = sum(m.get("currentWorkload", 0) for m in members)
                idle_members = [m for m in members if m.get("currentWorkload", 0) < 3]
                busy_members = [m for m in members if m.get("currentWorkload", 0) >= 5]
                
                context_parts.append(f"""
Team: {team.get('displayName', team.get('name', 'Unknown'))}
  - Members: {len(members)}
  - Total Workload: {total_workload} tasks
  - Available/Idle Members ({len(idle_members)}): {', '.join([m.get('name', '') for m in idle_members]) or 'None'}
  - Busy Members ({len(busy_members)}): {', '.join([m.get('name', '') for m in busy_members]) or 'None'}""")
                
                # Member details
                for member in members:
                    workload = member.get("currentWorkload", 0)
                    status = "🟢 Available" if workload < 3 else ("🟡 Moderate" if workload < 5 else "🔴 Busy")
                    skills = ", ".join(member.get("skills", [])) or "General"
                    context_parts.append(f"    • {member.get('name', 'Unknown')} ({member.get('role', 'member')}) - {workload} tasks - {status} - Skills: {skills}")
        
        # Summary Stats
        total_projects = len(projects)
        active_projects = len([p for p in projects if p.get("status") == "active"])
        completed_projects = len([p for p in projects if p.get("status") == "completed"])
        total_members = sum(len(t.get("members", [])) for t in teams)
        
        context_parts.append(f"""
=== SUMMARY ===
Total Projects: {total_projects} ({active_projects} active, {completed_projects} completed)
Total Teams: {len(teams)}
Total Team Members: {total_members}
""")
        
        return "\n".join(context_parts)

    def generate_response(self, user_query: str, projects: List[Dict], teams: List[Dict]) -> str:
        """Generate an intelligent response using Gemini with full project context"""
        
        if not self.is_configured or not self.model:
            return self._fallback_response(user_query, projects, teams)
        
        # Build context
        context = self.build_context(projects, teams)
        
        # Create prompt
        system_prompt = """You are an intelligent AI Project Manager assistant. You have access to real-time data about all projects, teams, and team members in the system.

Your capabilities:
1. Answer questions about project status, progress, deadlines
2. Provide team information including member workload and availability
3. Suggest task assignments based on member skills and current workload
4. Give insights about project health and potential issues
5. Help with project planning and resource allocation

CRITICAL GUIDELINES:
- If the user asks about a SPECIFIC project (e.g., "progress of Project Alpha"), respond ONLY with information about that specific project. DO NOT list all projects.
- If the user asks about a SPECIFIC team (e.g., "who is on the frontend team"), respond ONLY with information about that team. DO NOT list all teams.
- Only list all projects/teams if the user explicitly asks for "all projects", "show all", "list projects", etc.
- Be concise but informative
- Use bullet points for clarity
- Include relevant numbers and percentages
- Highlight important issues or concerns
- If the requested project/team is not found in the data, clearly say it doesn't exist
- Use emojis sparingly for visual appeal
- Format responses nicely with markdown
- NEVER provide a generic response when the user asks a specific question

"""
        
        full_prompt = f"""{system_prompt}

CURRENT SYSTEM DATA:
{context}

USER QUERY: {user_query}

Please provide a helpful, accurate response based on the data above:"""
        
        try:
            response = self.model.generate_content(full_prompt)
            return response.text
        except Exception as e:
            print(f"❌ Gemini API error: {e}")
            return self._fallback_response(user_query, projects, teams)

    def _fallback_response(self, query: str, projects: List[Dict], teams: List[Dict]) -> str:
        """Fallback response when Gemini is unavailable"""
        query_lower = query.lower()
        
        # Project status query
        if any(word in query_lower for word in ["status", "progress", "how is", "project"]):
            # Check for specific project first
            for proj in projects:
                project_name = proj.get("name", "").lower()
                # Match full name or just the identifier (e.g., "alpha" in "Project Alpha")
                short_name = project_name.replace("project ", "").strip()
                if project_name in query_lower or short_name in query_lower:
                    total = proj.get("totalTasks", 0)
                    completed = proj.get("completedTasks", 0)
                    in_progress = proj.get("inProgressTasks", 0)
                    pending = proj.get("pendingTasks", 0)
                    progress = round((completed / total * 100), 1) if total > 0 else 0
                    deadline = proj.get('deadline', 'Not set')
                    if deadline and deadline != 'Not set':
                        deadline = deadline.split('T')[0] if 'T' in str(deadline) else deadline
                    return f"""📊 **{proj.get('name')}** Status

• Progress: {progress}% ({completed}/{total} tasks completed)
• In Progress: {in_progress} tasks
• Pending: {pending} tasks
• Status: {proj.get('status', 'unknown')}
• Deadline: {deadline}
• Team: {proj.get('assignedTeam', 'Not assigned')}"""
            
            # Only list all projects if asking generally (no specific project mentioned)
            if any(word in query_lower for word in ["all", "list", "show", "projects"]):
                if projects:
                    project_list = "\n".join([f"• {p.get('name')} - {p.get('status')} ({p.get('completedTasks', 0)}/{p.get('totalTasks', 0)} tasks)" for p in projects])
                    return f"📋 **All Projects:**\n{project_list}"
            return "No projects found matching your query. Try 'Show all projects' to see available projects."
        
        # Team query
        if any(word in query_lower for word in ["team", "member", "who"]):
            # Check for specific team first
            for team in teams:
                team_name = team.get("name", "").lower()
                display_name = team.get("displayName", "").lower()
                if team_name in query_lower or display_name in query_lower:
                    members = team.get("members", [])
                    member_list = "\n".join([f"  • {m.get('name')} ({m.get('role')}) - {m.get('currentWorkload', 0)} tasks" for m in members])
                    return f"""👥 **{team.get('displayName', team.get('name'))}**

Members ({len(members)}):
{member_list}"""
            
            # Only list all teams if asking generally
            if any(word in query_lower for word in ["all", "list", "show", "teams"]):
                if teams:
                    team_list = "\n".join([f"• {t.get('displayName', t.get('name'))} - {len(t.get('members', []))} members" for t in teams])
                    return f"👥 **All Teams:**\n{team_list}"
            return "No teams found matching your query. Try 'List all teams' to see available teams."
        
        return "I can help with project status, team info, and task management. Try 'Show all projects' or 'Who is on the frontend team?'"


# Singleton instance
gemini_service = GeminiService()
