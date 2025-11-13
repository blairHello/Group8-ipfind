import os
import subprocess


def run_cmd(cmd):
    """Run command and return result"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)


def main():
    print("🔍 Pre-commit Debug Diagnostic")
    print("=" * 50)

    # 1. Check if we're in a git repository
    print("\n1. Checking Git repository...")
    success, stdout, stderr = run_cmd("git status")
    if success:
        print("   ✅ In a Git repository")
    else:
        print("   ❌ Not a Git repository or no commits yet")
        print("   Run: git init && git add . && git commit -m 'initial'")
        return

    # 2. Check pre-commit installation
    print("\n2. Checking pre-commit installation...")
    success, stdout, stderr = run_cmd("pre-commit --version")
    if success:
        print(f"   ✅ pre-commit installed: {stdout.strip()}")
    else:
        print("   ❌ pre-commit not installed")
        print("   Run: pip install pre-commit")
        return

    # 3. Check config file
    print("\n3. Checking .pre-commit-config.yaml...")
    if os.path.exists(".pre-commit-config.yaml"):
        print("   ✅ Config file exists")
        with open(".pre-commit-config.yaml", "r") as f:
            content = f.read()
            print(f"   Config size: {len(content)} bytes")
    else:
        print("   ❌ Config file missing")
        print("   Create .pre-commit-config.yaml in root directory")
        return

    # 4. Check if hooks are installed
    print("\n4. Checking Git hooks...")
    success, stdout, stderr = run_cmd("git rev-parse --git-path hooks")
    if success:
        hooks_dir = stdout.strip()
        pre_commit_hook = os.path.join(hooks_dir, "pre-commit")
        if os.path.exists(pre_commit_hook):
            print("   ✅ pre-commit hook installed")
            with open(pre_commit_hook, "r") as f:
                if "pre-commit" in f.read():
                    print("   ✅ Hook contains pre-commit reference")
                else:
                    print("   ❌ Hook file seems incorrect")
        else:
            print("   ❌ pre-commit hook not found in git hooks")

    # 5. Check pre-commit installation status
    print("\n5. Checking pre-commit installation status...")
    success, stdout, stderr = run_cmd("pre-commit list")
    if success:
        print("   ✅ pre-commit list works")
        if stdout.strip():
            print("   Hooks configured:")
            for line in stdout.strip().split("\n"):
                print(f"- {line}")
        else:
            print("   ⚠️  No hooks configured")
    else:
        print("   ❌ pre-commit list failed")
        print(f"   Error: {stderr}")

    # 6. Try to run pre-commit
    print("\n6. Testing pre-commit run...")
    success, stdout, stderr = run_cmd("pre-commit run --all-files")
    if success:
        print("   ✅ pre-commit runs successfully")
        if stdout.strip():
            print("   Output:", stdout)
    else:
        print("   ❌ pre-commit run failed")
        print("   Error output:", stderr)
        if stdout.strip():
            print("   Standard output:", stdout)

    # 7. Check file permissions
    print("\n7. Checking file permissions...")
    files_to_check = [".pre-commit-config.yaml", "app.py", "test/test_ipfind.py"]
    for file in files_to_check:
        if os.path.exists(file):
            print(f"   ✅ {file} exists")
        else:
            print(f"   ❌ {file} missing")

    print("\n" + "=" * 50)
    print("🎯 Next steps based on findings above")


if __name__ == "__main__":
    main()
