import shutil
import os

source_dir = "/Users/alpfr/Downloads/scripts/ai-governance-dashboard/ai-compliance-platform"
dest_dir = "/Users/alpfr/Downloads/scripts/ai-compliance-platform"

files_to_copy = [
    "frontend/src/components/Dashboard.js",
    "frontend/src/components/LLMManagement.js",
    "frontend/src/components/ModelSelectionDropdown.js"
]

for file in files_to_copy:
    src_file = os.path.join(source_dir, file)
    dst_file = os.path.join(dest_dir, file)
    print(f"Copying {src_file} -> {dst_file}")
    shutil.copy2(src_file, dst_file)
