

import os
import importlib.util
import sys

def find_and_import_app():
    possible_files = ['test/app.py', 'test/ipfind.py', 'test/main.py', 'test/server.py']
    app_instance = None
    validation_function = None
    
    for file in possible_files:
        if os.path.exists(file):
            print(f"Found potential app file: {file}")
            try:
                spec = importlib.util.spec_from_file_location("app_module", file)
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                
                # Look for Flask app
                for attr in dir(module):
                    obj = getattr(module, attr)
                    if hasattr(obj, 'run') and callable(getattr(obj, 'run', None)):
                        app_instance = obj
                        print(f"Found Flask app: {attr}")
                
                # Look for validation function
                if hasattr(module, 'is_valid_public_ip'):
                    validation_function = module.is_valid_public_ip
                    print("Found is_valid_public_ip function")
                    
            except Exception as e:
                print(f"Error importing {file}: {e}")
    
    return app_instance, validation_function

if __name__ == "__main__":
    app, validation_func = find_and_import_app()
    if app:
        print("✅ Successfully found Flask app")
    else:
        print("❌ Could not find Flask app")