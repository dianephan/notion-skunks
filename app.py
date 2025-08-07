from flask import Flask, render_template, request, jsonify
import os
from dotenv import load_dotenv
from notion_client import Client
import json
from datetime import datetime

load_dotenv()
app = Flask(__name__)
notion = Client(auth=os.getenv("NOTION_TOKEN"))

@app.route('/')
def index():
    """Main diary page"""
    return render_template('index.html')

# see the names in the db 
@app.route('/api/debug/database', methods=['GET'])
def debug_database():
    """Debug endpoint to see database properties"""
    try:
        database_id = os.getenv("NOTION_DATABASE_ID")
        if not database_id:
            return jsonify({"error": "Database ID not configured"}), 400
        
        database = notion.databases.retrieve(database_id)
        properties = database.get("properties", {})
        
        # Extract property information
        property_info = {}
        for prop_name, prop_value in properties.items():
            property_info[prop_name] = {
                "type": prop_value["type"],
                "id": prop_value.get("id", "N/A")
            }
        return jsonify({
            "database_id": database_id,
            "database_title": database.get("title", []),
            "properties": property_info
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/notion/pages', methods=['GET'])
def get_notion_pages():
    """Get pages from Notion database"""
    try:
        database_id = os.getenv("NOTION_DATABASE_ID")
        if not database_id:
            return jsonify({"error": "Database ID not configured"}), 400
        
        response = notion.databases.query(
            database_id=database_id,
        )
        
        pages = []
        for page in response.get("results", []):
            page_data = {
                "id": page["id"],
                "title": "",
                "url": page["url"],
                "content": ""
            }
        
            # Extract Link property (URL)
            if "properties" in page and "Link" in page["properties"]:
                link_prop = page["properties"]["Link"]
                if link_prop["type"] == "url" and link_prop["url"]:
                    page_data["title"] = link_prop["url"]  # Use URL as title for display
                    page_data["url"] = link_prop["url"]
            
            # Extract Notes property (rich_text)
            if "properties" in page and "Notes" in page["properties"]:
                notes_prop = page["properties"]["Notes"]
                if notes_prop["type"] == "rich_text" and notes_prop["rich_text"]:
                    page_data["content"] = notes_prop["rich_text"][0]["plain_text"]
            
            pages.append(page_data)
        
        return jsonify({"pages": pages})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/notion/create', methods=['POST'])
def create_notion_page():
    """Create a new page in Notion database"""
    try:
        data = request.get_json()
        link_url = data.get('title', '')  # This will be the URL
        notes = data.get('content', '')   # This will be the notes content
        
        database_id = os.getenv("NOTION_DATABASE_ID")
        if not database_id:
            return jsonify({"error": "Database ID not configured"}), 400
        
        # Create page in Notion with Link and Notes properties
        new_page = notion.pages.create(
            parent={"database_id": database_id},
            properties={
                "Link": {
                    "url": link_url
                },
                "Notes": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {
                                "content": notes
                            }
                        }
                    ]
                }
            }
        )
        
        return jsonify({
            "success": True,
            "page_id": new_page["id"],
            "url": new_page["url"]
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 