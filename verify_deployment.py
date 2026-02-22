#!/usr/bin/env python3
"""
Local deployment verification script for Render backend
Checks all dependencies and configurations are correct
"""

import sys
import subprocess
from pathlib import Path

def run_check(name: str, command: list) -> bool:
    """Run a check and return success/failure"""
    print(f"\n🔍 {name}...")
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            print(f"✅ {name}")
            if result.stdout:
                print(f"   {result.stdout.strip()}")
            return True
        else:
            print(f"❌ {name}")
            if result.stderr:
                print(f"   Error: {result.stderr.strip()}")
            return False
    except subprocess.TimeoutExpired:
        print(f"❌ {name} (timeout)")
        return False
    except Exception as e:
        print(f"❌ {name} ({str(e)})")
        return False


def main():
    print("=" * 60)
    print("Backend Deployment Verification")
    print("=" * 60)
    
    checks = [
        ("Python version check", ["python", "--version"]),
        ("Requirements file exists", ["ls", "backend/requirements.txt"]),
        ("Render config exists", ["ls", "render.yaml"]),
        ("Environment config", ["python", "-c", "from app.main import app; print('FastAPI app loaded')"]),
        ("Database setup", ["python", "-c", "import sqlalchemy; print('SQLAlchemy available')"]),
        ("Authentication", ["python", "-c", "from app.auth import router; print('Auth router loaded')"]),
    ]
    
    # Change to backend directory for some checks
    backend_path = Path("backend")
    if not backend_path.exists():
        print(f"❌ backend/ directory not found!")
        sys.exit(1)
    
    original_cwd = Path.cwd()
    import os
    os.chdir("backend")
    
    results = []
    for name, cmd in checks:
        results.append(run_check(name, cmd))
    
    os.chdir(original_cwd)
    
    # Summary
    print("\n" + "=" * 60)
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print(f"✅ All checks passed! ({passed}/{total})")
        print("\n🚀 Backend is ready for deployment on Render")
        print("\nNext steps:")
        print("1. Push to GitHub: git add . && git commit -m 'deployment' && git push")
        print("2. Create web service on Render")
        print("3. Set environment variables in Render dashboard")
        print("4. Deploy!")
        sys.exit(0)
    else:
        print(f"⚠️  Some checks failed ({passed}/{total})")
        print("\nPlease fix the issues above before deploying")
        sys.exit(1)


if __name__ == "__main__":
    main()
