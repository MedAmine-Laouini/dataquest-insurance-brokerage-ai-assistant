#!/usr/bin/env python3
"""
Frontend deployment verification script for Vercel
Checks all configuration and build readiness
"""

import subprocess
import json
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


def check_file_exists(filepath: str) -> bool:
    """Check if a file exists"""
    path = Path(filepath)
    if path.exists():
        print(f"✅ {filepath} exists")
        return True
    else:
        print(f"❌ {filepath} not found")
        return False


def main():
    print("=" * 60)
    print("Frontend Deployment Verification (Vercel)")
    print("=" * 60)
    
    checks = [
        ("Node.js version", ["node", "--version"]),
        ("npm version", ["npm", "--version"]),
        ("Next.js build", ["npm", "run", "build"]),
    ]
    
    file_checks = [
        "front-end/vercel.json",
        "front-end/.env.example",
        "front-end/next.config.mjs",
        "front-end/package.json",
        "front-end/tsconfig.json",
    ]
    
    # Change to frontend directory
    import os
    original_cwd = Path.cwd()
    os.chdir("front-end")
    
    results = []
    
    # File checks
    print("\n📁 Checking configuration files...")
    for file_check in file_checks:
        results.append(check_file_exists(file_check.replace("front-end/", "")))
    
    # Command checks
    print("\n🔧 Checking dependencies and build...")
    for name, cmd in checks:
        results.append(run_check(name, cmd))
    
    os.chdir(original_cwd)
    
    # Summary
    print("\n" + "=" * 60)
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print(f"✅ All checks passed! ({passed}/{total})")
        print("\n🚀 Frontend is ready for deployment on Vercel")
        print("\nNext steps:")
        print("1. Create .env.local from .env.example")
        print("2. Set NEXT_PUBLIC_API_URL to your backend URL")
        print("3. Test locally: npm run dev")
        print("4. Push to GitHub: git add . && git commit && git push")
        print("5. Deploy on Vercel")
        return 0
    else:
        print(f"⚠️  Some checks failed ({passed}/{total})")
        print("\nPlease fix the issues above before deploying")
        return 1


if __name__ == "__main__":
    exit(main())
