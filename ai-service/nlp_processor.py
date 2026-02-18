"""
nlp_processor.py - Enhanced NLP Engine for Project Management AI Chatbot
Handles intent classification, entity extraction, and smart task allocation
"""
import re
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from data_store import (
    TEAMS_DATA, PROJECTS_DATA, TASK_KEYWORDS,
    get_all_team_members, find_member_by_name,
    get_team_members, categorize_task_by_keywords,
    get_members_with_lowest_workload
)


class NLPProcessor:
    """
    Enhanced NLP processor that handles:
    1. Smart Queries - Project status, progress, team info
    2. Bulk Actions - Create projects, assign tasks intelligently
    """
    
    # Intent patterns for classification
    INTENT_PATTERNS = {
        "status_query": [
            r"(?:what(?:'s| is)|tell me|show me|get)\s+(?:the\s+)?(?:status|progress|update|info|information)\s+(?:of|for|on)\s+(.+)",
            r"(?:status|progress|update)\s+(?:of|for|on)\s+(.+)",
            r"how\s+(?:is|are)\s+(.+)\s+(?:doing|going|progressing)",
            r"(?:project\s+)?(\w+)\s+(?:status|progress|update)",
        ],
        "create_project": [
            r"create\s+(?:a\s+)?(?:new\s+)?(?:project\s+)?(\w+)",
            r"(?:set up|setup|start|initialize|init)\s+(?:a\s+)?(?:new\s+)?project\s+(\w+)",
            r"make\s+(?:a\s+)?(?:new\s+)?project\s+(\w+)",
        ],
        "list_teams": [
            r"(?:list|show|get|what are)\s+(?:all\s+)?(?:the\s+)?teams",
            r"who\s+(?:is|are)\s+(?:on|in)\s+(?:the\s+)?teams?",
        ],
        "list_members": [
            r"(?:list|show|who)\s+(?:is|are)?\s*(?:in|on)\s+(?:the\s+)?(\w+)\s+team",
            r"(\w+)\s+team\s+members",
        ],
        "assign_tasks": [
            r"assign\s+(\d+)\s+tasks?\s+to\s+(\w+)",
            r"give\s+(\d+)\s+tasks?\s+to\s+(\w+)",
        ],
        "help": [
            r"(?:help|what can you do|commands|how to use)",
        ]
    }
    
    def __init__(self):
        self.conversation_history = []
    
    def parse_query(self, query: str) -> Dict[str, Any]:
        """
        Main entry point for query parsing.
        Analyzes the user query and returns intent + structured data.
        """
        original_query = query
        query = query.lower().strip()
        
        # Store in conversation history
        self.conversation_history.append({"role": "user", "content": original_query})
        
        # 1. Check for STATUS QUERY
        if self._is_status_query(query):
            return self._parse_status_query(query)
        
        # 2. Check for BULK PROJECT CREATION
        if self._is_creation_query(query):
            return self._parse_creation(query, original_query)
        
        # 3. Check for TEAM INFO queries
        if self._is_team_query(query):
            return self._parse_team_query(query)
        
        # 4. Check for HELP
        if self._is_help_query(query):
            return self._generate_help_response()
        
        # 5. Fallback - Unknown intent
        return {
            "intent": "unknown",
            "data": {},
            "reply": self._get_fallback_message()
        }
    
    def _is_status_query(self, query: str) -> bool:
        """Check if query is asking for project status"""
        status_keywords = ["status", "progress", "update", "how is", "how are", 
                          "tell me about", "what's the", "info on", "details of"]
        return any(kw in query for kw in status_keywords)
    
    def _is_creation_query(self, query: str) -> bool:
        """Check if query is asking to create something"""
        create_keywords = ["create", "make", "set up", "setup", "start", "initialize", 
                          "new project", "add project"]
        return any(kw in query for kw in create_keywords)
    
    def _is_team_query(self, query: str) -> bool:
        """Check if query is about teams"""
        team_keywords = ["team", "teams", "members", "who is on", "who are in"]
        return any(kw in query for kw in team_keywords)
    
    def _is_help_query(self, query: str) -> bool:
        """Check if user is asking for help"""
        help_keywords = ["help", "what can you", "how to", "commands", "what do you do"]
        return any(kw in query for kw in help_keywords)
    
    def _parse_status_query(self, query: str) -> Dict[str, Any]:
        """
        Parse status/progress queries and extract project name.
        Examples:
        - "Tell me the progress of Project A"
        - "What's the status of Project Alpha"
        - "How is Project Beta doing?"
        """
        # Try multiple patterns to extract project name
        patterns = [
            r"(?:progress|status|update|info|information|details)\s+(?:of|for|on|about)\s+(?:the\s+)?(?:project\s+)?([a-zA-Z0-9\s]+?)(?:\?|$|\.)",
            r"(?:project)\s+([a-zA-Z0-9]+)(?:'s)?\s+(?:status|progress)",
            r"how\s+is\s+(?:the\s+)?(?:project\s+)?([a-zA-Z0-9\s]+?)\s+(?:doing|going|progressing)",
            r"(?:tell|show)\s+me\s+(?:about\s+)?(?:the\s+)?(?:project\s+)?([a-zA-Z0-9\s]+)",
        ]
        
        project_name = None
        for pattern in patterns:
            match = re.search(pattern, query, re.IGNORECASE)
            if match:
                project_name = match.group(1).strip()
                break
        
        # If no pattern matched, try to find any word after "project"
        if not project_name:
            simple_match = re.search(r"project\s+([a-zA-Z0-9]+)", query)
            if simple_match:
                project_name = simple_match.group(1)
        
        if not project_name:
            return {
                "intent": "status_query",
                "data": {},
                "reply": "I'd be happy to provide project status! Which project would you like to know about? (e.g., 'Status of Project Alpha')"
            }
        
        # Normalize project name
        project_name = f"Project {project_name.replace('project', '').strip().title()}"
        
        return {
            "intent": "status_query",
            "data": {
                "projectName": project_name
            },
            "reply": None  # Backend will generate response with actual data
        }
    
    def _parse_creation(self, query: str, original_query: str) -> Dict[str, Any]:
        """
        Parse bulk project creation queries.
        Examples:
        - "Create Project B with 16 tasks, assign 7 to frontend (John, Sarah), 5 to backend (Mike, Tom), 4 to testing (Lisa)"
        - "Create 5 tasks for Project X"
        - "Create Project Y with frontend and backend teams"
        """
        try:
            # Extract Project Name
            name_patterns = [
                r"create\s+(?:a\s+)?(?:new\s+)?project\s+([a-zA-Z0-9]+)",
                r"(?:project|for)\s+([a-zA-Z0-9]+)\s+with",
                r"create\s+(?:a\s+)?(?:new\s+)?([a-zA-Z0-9]+)\s+project",
            ]
            
            project_name = "New Project"
            for pattern in name_patterns:
                match = re.search(pattern, query, re.IGNORECASE)
                if match:
                    project_name = f"Project {match.group(1).title()}"
                    break
            
            # Extract Total Tasks
            task_patterns = [
                r"with\s+(\d+)\s+tasks?",
                r"(\d+)\s+tasks?\s+(?:for|to|in)",
                r"create\s+(\d+)\s+tasks?",
            ]
            
            total_tasks = 0
            for pattern in task_patterns:
                match = re.search(pattern, query)
                if match:
                    total_tasks = int(match.group(1))
                    break
            
            # Extract Teams and their task assignments
            # Pattern: "N to team (members)" or "N to team team (members)"
            teams = []
            
            # Match patterns like: "7 to frontend (John, Sarah)" or "7 to frontend team (John, Sarah)"
            team_matches = re.findall(
                r"(\d+)\s+to\s+(\w+)(?:\s+team)?\s*\(([^)]+)\)", 
                query, 
                re.IGNORECASE
            )
            
            calculated_total = 0
            
            for count_str, team_name, members_str in team_matches:
                count = int(count_str)
                members = [m.strip().title() for m in members_str.split(',')]
                
                # Validate team name
                team_name_lower = team_name.lower()
                if team_name_lower not in TEAMS_DATA:
                    return {
                        "intent": "error",
                        "data": {},
                        "reply": f"Unknown team '{team_name}'. Available teams: {', '.join(TEAMS_DATA.keys())}"
                    }
                
                # Validate members exist
                invalid_members = []
                for member in members:
                    if not find_member_by_name(member):
                        invalid_members.append(member)
                
                if invalid_members:
                    # Instead of error, we'll just note it
                    pass
                
                teams.append({
                    "name": team_name_lower,
                    "count": count,
                    "members": members
                })
                calculated_total += count
            
            # If no team matches with members, try simpler format: "N for teamname" (from form)
            if not teams:
                # Match patterns like: "5 for frontend", "3 for backend"
                simple_team_matches = re.findall(
                    r"(\d+)\s+(?:for|to)\s+(\w+)(?:\s+team)?",
                    query,
                    re.IGNORECASE
                )
                
                for count_str, team_name in simple_team_matches:
                    count = int(count_str)
                    team_name_lower = team_name.lower()
                    
                    # Validate team exists
                    if team_name_lower in TEAMS_DATA:
                        # Auto-assign members based on workload
                        team_members = get_members_with_lowest_workload(team_name_lower, count=3)
                        member_names = [m["name"] for m in team_members]
                        
                        teams.append({
                            "name": team_name_lower,
                            "count": count,
                            "members": member_names,
                            "auto_assigned": True
                        })
                        calculated_total += count
            
            # If still no explicit team assignments, auto-distribute
            if not teams and total_tasks > 0:
                # "Create 5 tasks for Project X" - auto-distribute
                return self._auto_distribute_tasks(project_name, total_tasks)
            
            # Validation: Check math
            if teams and total_tasks > 0 and calculated_total != total_tasks:
                return {
                    "intent": "error",
                    "data": {},
                    "reply": f"⚠️ Math mismatch! You specified {total_tasks} total tasks but assigned {calculated_total} ({'+'.join([str(t['count']) for t in teams])} = {calculated_total}). Please correct the numbers."
                }
            
            # If total_tasks wasn't specified, calculate from team assignments
            if total_tasks == 0 and teams:
                total_tasks = calculated_total
            
            # Generate confirmation message
            confirmation = self._generate_creation_confirmation(project_name, total_tasks, teams)
            
            return {
                "intent": "create_project",
                "data": {
                    "projectName": project_name,
                    "totalTasks": total_tasks,
                    "teams": teams
                },
                "reply": confirmation
            }
            
        except Exception as e:
            return {
                "intent": "error",
                "data": {},
                "reply": f"Sorry, I couldn't parse that creation command. Error: {str(e)}\n\nTry: 'Create Project X with 10 tasks, assign 5 to frontend (John, Sarah), 5 to backend (Mike, Tom)'"
            }
    
    def _auto_distribute_tasks(self, project_name: str, total_tasks: int) -> Dict[str, Any]:
        """
        Automatically distribute tasks across teams based on workload balancing.
        """
        teams = []
        
        # Default distribution ratios
        distribution = {
            "backend": 0.35,
            "frontend": 0.30,
            "testing": 0.20,
            "design": 0.10,
            "devops": 0.05
        }
        
        remaining = total_tasks
        
        for team_name, ratio in distribution.items():
            if remaining <= 0:
                break
                
            count = max(1, int(total_tasks * ratio))
            if count > remaining:
                count = remaining
            
            # Get members with lowest workload for this team
            team_members = get_members_with_lowest_workload(team_name, count=3)
            member_names = [m["name"] for m in team_members]
            
            if member_names:
                teams.append({
                    "name": team_name,
                    "count": count,
                    "members": member_names,
                    "auto_assigned": True
                })
                remaining -= count
        
        return {
            "intent": "create_project",
            "data": {
                "projectName": project_name,
                "totalTasks": total_tasks,
                "teams": teams,
                "autoDistributed": True
            },
            "reply": self._generate_auto_distribution_message(project_name, total_tasks, teams)
        }
    
    def _generate_creation_confirmation(self, project_name: str, total_tasks: int, teams: List[Dict]) -> str:
        """Generate a confirmation message for project creation"""
        msg = f"✅ Ready to create **{project_name}** with {total_tasks} tasks:\n\n"
        
        for team in teams:
            members = ", ".join(team["members"])
            msg += f"• {team['name'].title()} Team: {team['count']} tasks → {members}\n"
        
        msg += "\n✓ Task distribution validated. Proceed with creation?"
        return msg
    
    def _generate_auto_distribution_message(self, project_name: str, total_tasks: int, teams: List[Dict]) -> str:
        """Generate message for auto-distributed tasks"""
        msg = f"🤖 Auto-distributing {total_tasks} tasks for **{project_name}**:\n\n"
        
        for team in teams:
            members = ", ".join(team["members"][:2])  # Show first 2 members
            if len(team["members"]) > 2:
                members += f" +{len(team['members']) - 2} more"
            msg += f"• {team['name'].title()}: {team['count']} tasks → {members}\n"
        
        msg += "\n(Assigned based on current workload balancing)"
        return msg
    
    def _parse_team_query(self, query: str) -> Dict[str, Any]:
        """Parse queries about teams and members"""
        # Check if asking about specific team
        team_match = re.search(r"(?:in|on|of)\s+(?:the\s+)?(\w+)\s+team", query)
        
        if team_match:
            team_name = team_match.group(1).lower()
            if team_name in TEAMS_DATA:
                team_data = TEAMS_DATA[team_name]
                members = team_data["members"]
                
                member_list = "\n".join([
                    f"• {m['name']} ({m['role']}) - Workload: {m['workload']} tasks"
                    for m in members
                ])
                
                return {
                    "intent": "team_info",
                    "data": {"team": team_name},
                    "reply": f"👥 **{team_data['display_name']}**\n\n{member_list}"
                }
        
        # List all teams
        teams_summary = []
        for name, data in TEAMS_DATA.items():
            member_count = len(data["members"])
            teams_summary.append(f"• {data['display_name']}: {member_count} members")
        
        return {
            "intent": "team_info",
            "data": {},
            "reply": f"📋 **Available Teams:**\n\n" + "\n".join(teams_summary) + "\n\nAsk about a specific team: 'Who is on the frontend team?'"
        }
    
    def _generate_help_response(self) -> Dict[str, Any]:
        """Generate help message"""
        help_text = """🤖 **AI Project Manager - Help**

**I can help you with:**

1️⃣ **Project Status Queries**
   • "What's the status of Project Alpha?"
   • "Tell me the progress of Project A"
   • "How is Project Beta doing?"

2️⃣ **Create Projects & Tasks**
   • "Create Project X with 10 tasks"
   • "Create Project B with 16 tasks, assign 7 to frontend (John, Sarah), 5 to backend (Mike, Tom), 4 to testing (Lisa)"

3️⃣ **Team Information**
   • "List all teams"
   • "Who is on the frontend team?"
   • "Show backend team members"

**Available Teams:** Frontend, Backend, Testing, Design, DevOps"""
        
        return {
            "intent": "help",
            "data": {},
            "reply": help_text
        }
    
    def _get_fallback_message(self) -> str:
        """Return a helpful fallback message"""
        return """I'm not sure I understand. Here's what I can help with:

• **Status**: "What's the status of Project A?"
• **Create**: "Create Project X with 10 tasks"
• **Teams**: "Who is on the frontend team?"

Type 'help' for more examples!"""
    
    def generate_status_response(self, data: dict) -> str:
        """
        Generate a natural language response based on project stats.
        Called by the backend after fetching actual data.
        """
        project_name = data.get("projectName", "Project")
        stats = data.get("stats", {})
        
        total = stats.get("totalTasks", 0)
        completed = stats.get("completedTasks", 0)
        deadline = stats.get("deadline", "Unknown")
        status = stats.get("status", "unknown")
        
        # Calculate progress percentage
        if total == 0:
            percent = 0
        else:
            percent = int((completed / total) * 100)
        
        # Generate progress bar
        bar_filled = int(percent / 10)
        bar_empty = 10 - bar_filled
        progress_bar = "█" * bar_filled + "░" * bar_empty
        
        # Determine health status
        health_emoji = "🟢"
        health_text = "On Track"
        risk_msg = ""
        
        if percent < 30:
            health_emoji = "🔴"
            health_text = "At Risk"
        elif percent < 60:
            health_emoji = "🟡"
            health_text = "Needs Attention"
        
        # Check deadline risk
        try:
            deadline_date = datetime.fromisoformat(deadline.replace("Z", ""))
            days_until = (deadline_date - datetime.now()).days
            
            if days_until < 0:
                risk_msg = "\n\n⚠️ **OVERDUE**: Deadline has passed!"
                health_emoji = "🔴"
            elif days_until < 14 and percent < 70:
                risk_msg = f"\n\n⚠️ **Risk Alert**: Only {days_until} days until deadline and {100-percent}% remaining!"
            elif days_until < 7:
                risk_msg = f"\n\n⏰ **Reminder**: {days_until} days until deadline!"
        except:
            pass
        
        # Build response
        response = f"""📊 **{project_name} Status Report**

{health_emoji} **Status**: {status.title()} - {health_text}

**Progress**: {percent}%
{progress_bar} ({completed}/{total} tasks)

📅 **Deadline**: {deadline}{risk_msg}"""
        
        # Add team breakdown hint
        in_progress = total - completed - (total // 4)  # Rough estimate
        if in_progress < 0:
            in_progress = 0
        pending = total - completed - in_progress
        if pending < 0:
            pending = 0
            
        response += f"""

**Task Breakdown**:
• ✅ Completed: {completed}
• 🔄 In Progress: {in_progress}
• 📋 Pending: {pending}"""
        
        return response
    
    def generate_task_assignments(self, project_name: str, teams: List[Dict]) -> List[Dict]:
        """
        Generate smart task assignments with workload balancing.
        Returns a list of task objects ready for database insertion.
        """
        tasks = []
        task_templates = {
            "frontend": [
                "Implement {} component",
                "Create {} page layout",
                "Build {} form UI",
                "Design {} modal",
                "Add {} feature styling",
            ],
            "backend": [
                "Create {} API endpoint",
                "Implement {} service logic",
                "Set up {} database model",
                "Build {} controller",
                "Add {} validation middleware",
            ],
            "testing": [
                "Write unit tests for {}",
                "Create E2E tests for {}",
                "Perform {} integration testing",
                "Add test coverage for {}",
            ],
            "design": [
                "Design {} mockups",
                "Create {} wireframes",
                "Build {} prototype",
            ],
            "devops": [
                "Configure {} deployment",
                "Set up {} monitoring",
                "Create {} pipeline",
            ]
        }
        
        for team in teams:
            team_name = team["name"].lower()
            members = team["members"]
            count = team["count"]
            templates = task_templates.get(team_name, ["Complete {} task"])
            
            for i in range(count):
                # Round-robin assignment
                assigned_member = members[i % len(members)]
                
                # Generate task title
                task_num = i + 1
                template = templates[i % len(templates)]
                task_title = template.format(f"{project_name} {team_name.title()} {task_num}")
                
                tasks.append({
                    "title": task_title,
                    "team": team_name,
                    "assignedTo": assigned_member,
                    "status": "pending"
                })
        
        return tasks


# Global instance
nlp_engine = NLPProcessor()
