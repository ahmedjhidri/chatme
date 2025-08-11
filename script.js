// Tab switching
const tabConverterBtn = document.getElementById("tabConverter");
const tabBeamBtn = document.getElementById("tabBeam");
const converterSection = document.getElementById("converterSection");
const beamSection = document.getElementById("beamSection");

tabConverterBtn.onclick = () => {
  tabConverterBtn.classList.add("active");
  tabBeamBtn.classList.remove("active");
  converterSection.style.display = "block";
  beamSection.style.display = "none";
};

tabBeamBtn.onclick = () => {
  tabBeamBtn.classList.add("active");
  tabConverterBtn.classList.remove("active");
  converterSection.style.display = "none";
  beamSection.style.display = "block";
};

// Unit options by type
const unitOptions = {
  length: [
    { name: "Meter (m)", value: "m", toBase: 1 },
    { name: "Centimeter (cm)", value: "cm", toBase: 0.01 },
    { name: "Inch (in)", value: "in", toBase: 0.0254 },
    { name: "Foot (ft)", value: "ft", toBase: 0.3048 },
  ],
  weight: [
    { name: "Kilogram (kg)", value: "kg", toBase: 1 },
    { name: "Pound (lb)", value: "lb", toBase: 0.453592 },
  ],
  temperature: [
    { name: "Celsius (°C)", value: "c" },
    { name: "Fahrenheit (°F)", value: "f" },
  ],
  torque: [
    { name: "Newton meter (Nm)", value: "nm", toBase: 1 },
    { name: "Pound-foot (lb-ft)", value: "lbft", toBase: 1.35582 },
  ],
};

const convertTypeSelect = document.getElementById("convertType");
const inputUnitSelect = document.getElementById("inputUnit");
const outputUnitSelect = document.getElementById("outputUnit");
const inputValue = document.getElementById("inputValue");
const convertResultDiv = document.getElementById("convertResult");

// Update units dropdowns based on convert type
function updateUnitDropdowns() {
  const type = convertTypeSelect.value;
  const units = unitOptions[type];

  inputUnitSelect.innerHTML = "";
  outputUnitSelect.innerHTML = "";

  units.forEach((unit) => {
    const option1 = document.createElement("option");
    option1.value = unit.value;
    option1.textContent = unit.name;
    inputUnitSelect.appendChild(option1);

    const option2 = document.createElement("option");
    option2.value = unit.value;
    option2.textContent = unit.name;
    outputUnitSelect.appendChild(option2);
  });

  // Set defaults
  inputUnitSelect.selectedIndex = 0;
  outputUnitSelect.selectedIndex = 1;
  convertResultDiv.textContent = "";
}

convertTypeSelect.addEventListener("change", updateUnitDropdowns);
updateUnitDropdowns();

// Convert function
function convertValue(type, value, fromUnit, toUnit) {
  if (type === "temperature") {
    if (fromUnit === toUnit) return value;
    if (fromUnit === "c" && toUnit === "f") return value * 9 / 5 + 32;
    if (fromUnit === "f" && toUnit === "c") return (value - 32) * 5 / 9;
  } else {
    // Convert to base unit first
    const from = unitOptions[type].find((u) => u.value === fromUnit);
    const to = unitOptions[type].find((u) => u.value === toUnit);
    if (!from || !to) return null;

    const baseValue = value * from.toBase;
    return baseValue / to.toBase;
  }
  return null;
}

// Handle conversion form submit
document.getElementById("converterForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const type = convertTypeSelect.value;
  const value = parseFloat(inputValue.value);
  const fromUnit = inputUnitSelect.value;
  const toUnit = outputUnitSelect.value;

  if (isNaN(value)) {
    convertResultDiv.textContent = "Please enter a valid number.";
    return;
  }

  const result = convertValue(type, value, fromUnit, toUnit);

  if (result === null) {
    convertResultDiv.textContent = "Conversion error.";
    return;
  }

  convertResultDiv.textContent = `${value} ${fromUnit} = ${result.toFixed(4)} ${toUnit}`;
});

// Beam stress calculator logic
const sectionTypeSelect = document.getElementById("sectionType");
const rectInputsDiv = document.getElementById("rectInputs");
const circleInputsDiv = document.getElementById("circleInputs");

sectionTypeSelect.addEventListener("change", () => {
  if (sectionTypeSelect.value === "rectangular") {
    rectInputsDiv.style.display = "block";
    circleInputsDiv.style.display = "none";
  } else {
    rectInputsDiv.style.display = "none";
    circleInputsDiv.style.display = "block";
  }
});

document.getElementById("beamForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const load = parseFloat(document.getElementById("load").value); // N
  const length = parseFloat(document.getElementById("length").value); // m
  const youngModulus = parseFloat(document.getElementById("youngModulus").value) * 1e9; // GPa to Pa
  const yieldStrength = parseFloat(document.getElementById("yieldStrength").value) * 1e6; // MPa to Pa

  let I = 0; // Moment of inertia in m^4
  const sectionType = sectionTypeSelect.value;

  if (isNaN(load) || isNaN(length) || isNaN(youngModulus) || isNaN(yieldStrength)) {
    document.getElementById("beamResult").textContent = "Please fill all required fields with valid numbers.";
    return;
  }

  if (sectionType === "rectangular") {
    const width = parseFloat(document.getElementById("width").value);
    const height = parseFloat(document.getElementById("height").value);
    if (isNaN(width) || isNaN(height)) {
      document.getElementById("beamResult").textContent = "Please enter width and height for rectangular section.";
      return;
    }
    I = (width * Math.pow(height, 3)) / 12;
  } else if (sectionType === "circular") {
    const diameter = parseFloat(document.getElementById("diameter").value);
    if (isNaN(diameter)) {
      document.getElementById("beamResult").textContent = "Please enter diameter for circular section.";
      return;
    }
    I = (Math.PI * Math.pow(diameter, 4)) / 64;
  }

  // Calculate max bending moment for simply supported beam with center load: M = P*L/4
  const M = load * length / 4;

  // Calculate max bending stress: σ = M*c / I
  // c = distance from neutral axis to outer fiber
  let c = 0;
  if (sectionType === "rectangular") {
    c = parseFloat(document.getElementById("height").value) / 2;
  } else {
    c = parseFloat(document.getElementById("diameter").value) / 2;
  }
  const sigma = (M * c) / I; // in Pa

  // Calculate deflection δ = (P*L^3)/(48*E*I)
  const delta = (load * Math.pow(length, 3)) / (48 * youngModulus * I);

  // Output results
  const stressMPa = sigma / 1e6;
  const deflectionMm = delta * 1000;

  let safetyMsg = "";
  if (sigma > yieldStrength) {
    safetyMsg = "⚠️ Warning: Stress exceeds yield strength! Beam may fail.";
  } else {
    safetyMsg = "✔️ Stress is within safe limits.";
  }

  document.getElementById("beamResult").innerHTML = `
    Max Bending Stress: <strong>${stressMPa.toFixed(2)} MPa</strong><br/>
    Max Deflection: <strong>${deflectionMm.toFixed(2)} mm</strong><br/>
    ${safetyMsg}
  `;
});
