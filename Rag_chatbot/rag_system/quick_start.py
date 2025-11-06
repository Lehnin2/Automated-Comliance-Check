"""
Quick Start Script for ODDO BHF Compliance RAG System
Automated setup and testing
"""
import os
import sys
from pathlib import Path

def print_header(text):
    """Print formatted header"""
    print("\n" + "=" * 60)
    print(text)
    print("=" * 60 + "\n")

def check_requirements():
    """Check if all requirements are met"""
    print_header("🔍 Checking Requirements")
    
    errors = []
    
    # Check Python version
    if sys.version_info < (3, 9):
        errors.append("Python 3.9+ required")
    else:
        print("✅ Python version OK")
    
    # Check if .env exists
    if not Path(".env").exists():
        print("⚠️  .env file not found")
        print("   Creating from .env.example...")
        if Path(".env.example").exists():
            import shutil
            shutil.copy(".env.example", ".env")
            print("   ✅ Created .env - Please edit and add your API key")
            print("   Or set USE_LOCAL_EMBEDDINGS=true for local embeddings")
        else:
            errors.append(".env.example not found")
    else:
        print("✅ .env file exists")
    
    # Check database files
    db_dir = Path("../database")
    required_files = [
        "rules_database.json",
        "disclaimers-glossary.json",
        "registration-countries.json",
        "compliance-mapping.json",
        "validation-schema.json",
        "usage-examples.json"
    ]
    
    missing_files = []
    for file in required_files:
        if not (db_dir / file).exists():
            missing_files.append(file)
    
    if missing_files:
        errors.append(f"Missing database files: {', '.join(missing_files)}")
    else:
        print(f"✅ All {len(required_files)} database files found")
    
    # Check dependencies
    try:
        import langchain
        import chromadb
        print("✅ Core dependencies installed")
    except ImportError as e:
        errors.append(f"Missing dependency: {e.name}")
        print(f"❌ Missing dependency: {e.name}")
        print("   Run: pip install -r requirements.txt")
    
    if errors:
        print("\n❌ Errors found:")
        for error in errors:
            print(f"   - {error}")
        return False
    
    print("\n✅ All requirements met!")
    return True

def build_vectorstore():
    """Build the vector store"""
    print_header("🏗️  Building Vector Store")
    
    try:
        from build_vectorstore import main as build_main
        
        # Set rebuild flag
        sys.argv = ["build_vectorstore.py", "--rebuild"]
        build_main()
        
        return True
    except Exception as e:
        print(f"❌ Error building vector store: {e}")
        import traceback
        traceback.print_exc()
        return False

def run_tests():
    """Run test queries"""
    print_header("🧪 Running Test Queries")
    
    try:
        from rag_query import ComplianceRAG
        
        rag = ComplianceRAG()
        
        test_queries = [
            "Quelles règles pour document retail français?",
            "Disclaimer pour client professionnel",
            "Validation pays de commercialisation",
        ]
        
        for i, query in enumerate(test_queries, 1):
            print(f"\n{i}. Query: {query}")
            result = rag.query(query)
            print(f"   ✅ Answer: {result['answer'][:100]}...")
            print(f"   📚 Sources: {result['num_sources']}")
        
        print("\n✅ All tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Error running tests: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main quick start function"""
    print_header("🚀 ODDO BHF Compliance RAG - Quick Start")
    
    print("This script will:")
    print("  1. Check requirements")
    print("  2. Build vector store (~2-5 min)")
    print("  3. Run test queries")
    print("  4. Launch interactive system")
    
    input("\nPress Enter to continue...")
    
    # Step 1: Check requirements
    if not check_requirements():
        print("\n❌ Please fix the errors above and run again")
        return
    
    # Step 2: Build vector store
    print("\n⏳ This may take a few minutes...")
    if not build_vectorstore():
        print("\n❌ Failed to build vector store")
        return
    
    # Step 3: Run tests
    if not run_tests():
        print("\n⚠️  Tests failed but system may still work")
    
    # Step 4: Launch interactive system
    print_header("✅ Setup Complete!")
    
    print("System is ready!")
    print("\nOptions:")
    print("  1. Launch interactive CLI")
    print("  2. Exit and use programmatically")
    
    choice = input("\nYour choice (1/2): ").strip()
    
    if choice == "1":
        print("\n🚀 Launching interactive system...")
        print("Type /quit to exit\n")
        
        from rag_query import main as rag_main
        rag_main()
    else:
        print("\n📚 To use the system:")
        print("  - Interactive: python rag_query.py")
        print("  - Programmatic: from rag_query import ComplianceRAG")
        print("\n✅ Happy querying!")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Interrupted by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
