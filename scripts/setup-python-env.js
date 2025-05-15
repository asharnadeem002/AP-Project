import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set paths - use path.resolve since process.cwd() might be different in some environments
const rootDir = path.resolve(__dirname, "..");
const pythonDir = path.join(rootDir, "python");
const venvDir = path.join(pythonDir, "venv");
const requirementsPath = path.join(pythonDir, "requirements.txt");

// Ensure python directory exists
if (!fs.existsSync(pythonDir)) {
  fs.mkdirSync(pythonDir, { recursive: true });
  console.log("Created python directory");
}

// Create requirements.txt if it doesn't exist
if (!fs.existsSync(requirementsPath)) {
  console.log("Creating requirements.txt...");
  fs.writeFileSync(
    requirementsPath,
    `absl-py==2.1.0
altair==5.5.0
astunparse==1.6.3
attrs==25.3.0
cachetools==5.5.2
certifi==2025.1.31
charset-normalizer==3.4.1
click==8.1.8
colorama==0.4.6
contourpy==1.3.1
cycler==0.12.1
Cython==3.0.12
filelock==3.18.0
flatbuffers==25.2.10
fonttools==4.56.0
fsspec==2025.3.0
gast==0.6.0
google-pasta==0.2.0
grpcio==1.71.0
h5py==3.13.0
idna==3.10
Jinja2==3.1.6
jsonschema==4.23.0
jsonschema-specifications==2024.10.1
keras==3.9.0
keras-facenet==0.3.2
kiwisolver==1.4.8
libclang==18.1.1
Markdown==3.7
markdown-it-py==3.0.0
MarkupSafe==3.0.2
matplotlib==3.10.1
mdurl==0.1.2
ml-dtypes==0.3.2
mpmath==1.3.0
mtcnn==1.0.0
numpy==1.26.4
opencv-python==4.10.0.84
opt_einsum==3.4.0
packaging==24.2
pillow==11.0.0
protobuf==4.25.6
psutil==7.0.0
py-cpuinfo==9.0.0
Pygments==2.19.1
pyparsing==3.2.1
python-dateutil==2.9.0.post0
PyYAML==6.0.2
referencing==0.36.2
requests==2.32.3
scipy==1.15.2
seaborn==0.13.2
six==1.17.0
sympy==1.13.1
tensorboard==2.16.2
tensorboard-data-server==0.7.2
tensorflow==2.16.2
termcolor==2.5.0
toml==0.10.2
torch==2.6.0
torchvision==0.21.0
tqdm==4.67.0
typing_extensions==4.12.2
ultralytics==8.3.39
ultralytics-thop==2.0.14
urllib3==2.3.0
Werkzeug==3.1.3
wrapt==1.17.2
fastapi==0.110.0
uvicorn==0.28.0
python-multipart==0.0.9
`
  );
  console.log("Created requirements.txt");
}

try {
  // Determine the Python command to use
  const pythonCommand = os.platform() === "win32" ? "python" : "python3";

  // Check if Python is installed
  try {
    execSync(`${pythonCommand} --version`, { stdio: "pipe" });
    console.log("Python is installed");
  } catch (error) {
    console.error("Python is not installed. Please install Python 3.x", error);
    process.exit(1);
  }

  // Create virtual environment if it doesn't exist
  if (!fs.existsSync(venvDir)) {
    console.log("Creating virtual environment...");
    execSync(`${pythonCommand} -m venv ${venvDir}`, { stdio: "inherit" });
    console.log("Virtual environment created");
  }

  // Determine the pip command based on the platform
  const pipCommand =
    os.platform() === "win32"
      ? path.join(venvDir, "Scripts", "pip")
      : path.join(venvDir, "bin", "pip");

  // Update pip first
  console.log("Updating pip...");
  execSync(`"${pipCommand}" install --upgrade pip`, {
    stdio: "inherit",
  });

  // Install requirements
  console.log("Installing requirements...");
  execSync(`"${pipCommand}" install -r "${requirementsPath}"`, {
    stdio: "inherit",
  });
  console.log("Requirements installed");

  console.log("Python environment setup complete!");
} catch (error) {
  console.error("Error setting up Python environment:", error.message);
  process.exit(1);
}
