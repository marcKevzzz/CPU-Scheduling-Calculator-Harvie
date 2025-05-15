import {
  renderResultTableTurnaround,
  renderResultTableWaiting,
  renderGanttChart,
  generateTimeline,
  renderCPUUtilization,
  getProcessData,
  addRow,
  deleteRow,
  onAlgorithmChange,
  resetUI,
} from "./algorithms/render.js";

import { calculateFCFS } from "./algorithms/fcfs.js";
import { calculateSJF } from "./algorithms/sjf.js";
import { calculateNPP } from "./algorithms/npp.js";
import { calculateRR } from "./algorithms/rr.js";
import { calculateSRTF } from "./algorithms/srtf.js";
import { calculatePP } from "./algorithms/pp.js";

function scheduleAndRender(algorithm, options = {}, mode) {
  const { processes, timeQuantum } = getProcessData("#processTable", mode);
  if (!processes || !processes.length) return;

  try {
    const output =
      options.algorithm === "RR"
        ? algorithm(processes, timeQuantum)
        : algorithm(processes);

    const { result, totalTime, totalIdle, ganttChart } = output;

    renderResultTableTurnaround(result);
    renderResultTableWaiting(result);
    renderGanttChart(options, ganttChart);
    generateTimeline(result);
    renderCPUUtilization(totalIdle, result, ganttChart);
  } catch (error) {
    console.error("Error during scheduling or rendering:", error);
  }
}

export function updateTableColumns(selectedValue) {
  const table = document.getElementById("processTable");
  const headerRow = table.querySelector("thead tr");
  const bodyRows = table.querySelectorAll("tbody tr");

  const hasPriorityColumn = table.querySelector("th.priority-col");
  const hasTimeQuantumColumn = table.querySelector("th.timeQuantum-col");

  const needsPriority = selectedValue === "NPP" || selectedValue === "PP";
  const needsTimeQuantum = selectedValue === "RR";

  // Remove Priority column if not needed
  if (!needsPriority && hasPriorityColumn) {
    hasPriorityColumn.remove();
    bodyRows.forEach((row) => {
      const priorityCell = row.querySelector("td.priority-col");
      if (priorityCell) priorityCell.remove();
    });
  }

  // Remove Time Quantum column if not needed
  if (!needsTimeQuantum && hasTimeQuantumColumn) {
    hasTimeQuantumColumn.remove();
    bodyRows.forEach((row) => {
      const tqCell = row.querySelector("td.timeQuantum-col");
      if (tqCell) tqCell.remove();
    });
  }

  // Add Priority column if needed and not already present
  if (needsPriority && !hasPriorityColumn) {
    const priorityHeader = document.createElement("th");
    priorityHeader.classList.add(
      "priority-col",
      "border",
      "border-gray-400",
      "p-1"
    );
    priorityHeader.innerHTML = `   <th class="border border-gray-400 p-1">P</th>`;
    headerRow.appendChild(priorityHeader);

    bodyRows.forEach((row) => {
      const newCell = document.createElement("td");
      newCell.classList.add("priority-col", "border", "border-gray-400", "p-1");
      newCell.innerHTML = `  <input
                    class="input border-0 outline-0 w-full bg-transparent drop-shadow-none ring-0 ps-1 input py-1"
                    type="number"
                    min="0"
                  />`;
      row.appendChild(newCell);
    });
  }

  // Add Time Quantum column if needed and not already present (as last column)
  if (needsTimeQuantum && !hasTimeQuantumColumn) {
    const tqHeader = document.createElement("th");
    tqHeader.classList.add(
      "timeQuantum-col",
      "border",
      "border-gray-400",
      "p-1"
    );
    tqHeader.innerHTML = `Tq`;
    headerRow.appendChild(tqHeader);
  }
}
let algorithmValue = "";

// // Initial check
// document.addEventListener("DOMContentLoaded", () => {
//   const selectedRadio = document.querySelector("input[type='radio']:checked");
// });

function validateTableInputs(algorithm, options = {}, mode) {
  let invalid = false;
  let firstInvalidInput = null;

  // Get all number inputs inside the table
  const inputs = document.querySelectorAll(
    "#processTable input[type='number']"
  );

  invalid = [...inputs].some((input) => {
    if (!input.value) {
      input.classList.add("is-invalid");
      if (!firstInvalidInput) {
        firstInvalidInput = input;
      }
      return true; // Stop as soon as one invalid input is found
    }
    input.classList.remove("is-invalid");
    return false;
  });

  if (invalid) {
    firstInvalidInput.scrollIntoView({ behavior: "smooth", block: "center" });
    firstInvalidInput.focus();

    showToast("Invalid Input");
    return false;
  }

  // If valid, run your computation
  const hide = document.querySelectorAll(".hide");
  hide.forEach((h) => {
    h.classList.remove("hide");
  });

  document.querySelector("#animate-spin").classList.remove("hide");

  const delay = Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000;
  setTimeout(() => {
    showToast(`Calculate Successful`, true);
    document.querySelector("#animate-spin").classList.add("hide");
    scheduleAndRender(algorithm, options, mode);
  }, delay);
  setTimeout(() => {
    document.querySelector("#lbll").classList.remove("hidden");
  }, delay);
}

// function resetUIS() {
//   ["head", "gbody", "tail", "queue", "turnaroundTable", "waitingTable"].forEach(
//     (id) => {
//       const el = document.getElementById(id);
//       if (el) el.innerHTML = "";
//     }
//   );
// }

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".algo-btn").forEach((b) => {
    b.addEventListener("click", function () {
      const selectedValue = document.getElementById("selected-priority").value;
      algorithmValue = selectedValue;
      updateTableColumns(selectedValue);
      algorithmValue = selectedValue;
      onAlgorithmChange(selectedValue);
      console.log("Selected Algorithm:", selectedValue);
      // You can use selectedValue as needed
    });
  });

  const addRowBtn = document.getElementById("addRow");
  if (addRowBtn) {
    addRowBtn.addEventListener("click", () => {
      addRow("#processTable", algorithmValue);
    });
  }

  const clearBtn = document.getElementById("clear");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      // Reset algorithm value and radio buttons FIRST
      algorithmValue = "";

      document.getElementById("gbody").innerHTML = `<div
                class="flex p-2 rounded sm:w-[25em] w-[15em]  mx-auto items-center"
              >
                <div class="border border-gray-400 w-1/8 gantt-box"></div>
                <div class="border border-gray-400 w-1/8 gantt-box"></div>
                <div class="border border-gray-400 w-1/8 gantt-box"></div>
                <div class="border border-gray-400 w-1/8 gantt-box"></div>
                <div class="border border-gray-400 w-1/8 gantt-box"></div>
                <div class="border border-gray-400 w-1/8 gantt-box"></div>
                <div class="border border-gray-400 w-1/8 gantt-box"></div>
                <div class="border border-gray-400 w-1/8 gantt-box"></div>
              </div>`;

      document.getElementById("resultTable").innerHTML = `<tbody>
                <tr>
                  <td class="border border-gray-400 p-2 font-mono">tt1</td>
                  <td class="border border-gray-400 p-2"></td>
                </tr>
                <tr>
                  <td class="border border-gray-400 p-2 font-mono">tt2</td>
                  <td class="border border-gray-400 p-2 w-[18rem]"></td>
                </tr>
                <tr>
                  <td class="border border-gray-400 p-2 font-mono">tt3</td>
                  <td class="border border-gray-400 p-2"></td>
                </tr>

                <tr>
                  <td class="border border-gray-400 p-2 font-mono w-[18rem]">
                    ttave
                  </td>
                  <td class="border border-gray-400 p-2"></td>
                </tr>
              </tbody>`;
      document.getElementById("resultTableWaitingTime").innerHTML = `<tbody>
                <tr>
                  <td class="border border-gray-400 p-2 font-mono">wt1</td>
                  <td class="border border-gray-400 p-2 w-[18rem]"></td>
                </tr>
                <tr>
                  <td class="border border-gray-400 p-2 font-mono">wt2</td>
                  <td class="border border-gray-400 p-2 w-[18rem]"></td>
                </tr>
                <tr>
                  <td class="border border-gray-400 p-2 font-mono">wt3</td>
                  <td class="border border-gray-400 p-2 w-[18rem]"></td>
                </tr>

                <tr>
                  <td class="border border-gray-400 p-2 font-mono w-[18rem]">
                    wtave
                  </td>
                  <td class="border border-gray-400 p-2"></td>
                </tr>
              </tbody>`;

      document.getElementById(
        "timeline"
      ).innerHTML = `<div class="flex items-center justify-between px-4 py-4 oo">
                <div class="timeline-vrline"></div>
                <div class="timeline-circle flex">
                  <div class="border-r-1 border-black md:w-[40px] h-[20px] w-[30px]"></div>
                  <div class="border-l-1 border-black md:w-[40px] h-[20px] w-[30px]"></div>
                </div>
                <div class="timeline-circle flex">
                  <div class="border-r-1 border-black md:w-[40px] h-[20px] w-[30px]"></div>
                  <div class="border-l-1 border-black md:w-[40px] h-[20px] w-[30px]"></div>
                </div>
                <div class="timeline-circle flex">
                  <div class="border-r-1 border-black md:w-[40px] h-[20px] w-[30px]"></div>
                  <div class="border-l-1 border-black md:w-[40px] h-[20px] w-[30px]"></div>
                </div>
              </div>`;
      // THEN reset UI (now that algorithmValue is cleared or defaulted)
      resetUI(algorithmValue);
      showToast("Calculation restart!", true);
    });
  }

  const deleteRowBtn = document.getElementById("deleteRow");
  if (deleteRowBtn) {
    deleteRowBtn.addEventListener("click", () => {
      deleteRow("#processTable");
    });
  }
  const calculate = document.getElementById("calculate");

  calculate.addEventListener("click", () => {
    if (!algorithmValue) {
      showToast("Please select an algorithm.");
      return;
    }

    let algorithmFn;
    switch (algorithmValue) {
      case "FCFS":
        algorithmFn = calculateFCFS;
        break;
      case "SJF":
        algorithmFn = calculateSJF;
        break;
      case "NPP":
        algorithmFn = calculateNPP;
        break;
      case "RR":
        algorithmFn = calculateRR;
        break;
      case "SRTF":
        algorithmFn = calculateSRTF;
        break;
      case "PP":
        algorithmFn = calculatePP;
        break;
      default:
        showToast("Unknown algorithm selected.");
        return;
    }
    validateTableInputs(
      algorithmFn,
      { algorithm: algorithmValue },
      algorithmValue
    );
  });

  document.getElementById("hideToast").addEventListener("click", (b) => {
    hideToast();
  });
});

let toastTimeout;

export function showToast(message, bool = false) {
  const toastLbl = document.getElementById("toastLbl");
  const toast = document.getElementById("toast-danger");
  if (bool) {
    const yes = document.getElementById("success");
    yes.classList.remove("hide");
    document.getElementById("no").classList.add("hide");
  } else {
    const no = document.getElementById("no");
    no.classList.remove("hide");
    document.getElementById("success").classList.add("hide");
  }

  // Set message
  toastLbl.textContent = message;

  // Show toast
  toast.classList.remove("hidden", "opacity-0");
  toast.classList.add("opacity-100");

  // Auto hide after 3s
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    hideToast();
  }, 3000);
}

function hideToast() {
  const toast = document.getElementById("toast-danger");
  toast.classList.add("opacity-0");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 100); // Match duration-300
}
