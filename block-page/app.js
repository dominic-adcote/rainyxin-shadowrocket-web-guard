import {
  ZHEJIANG_REPORT_URL,
  parseBlockContext,
} from "./core.mjs";

const context = parseBlockContext(window.location.href);

const categoryLabel = document.querySelector("#category-label");
const riskTitle = document.querySelector("#risk-title");
const riskDescription = document.querySelector("#risk-description");
const targetHost = document.querySelector("#target-host");
const riskChip = document.querySelector("#risk-chip");
const technicalNote = document.querySelector("#technical-note");
const standardActions = document.querySelector("#standard-actions");
const gamblingActions = document.querySelector("#gambling-actions");
const safeBack = document.querySelector("#safe-back");
const continueRisk = document.querySelector("#continue-risk");
const riskDialog = document.querySelector("#risk-dialog");
const dialogHost = document.querySelector("#dialog-host");
const confirmContinue = document.querySelector("#confirm-continue");

categoryLabel.textContent = context.config.label;
riskTitle.textContent = context.config.title;
riskDescription.textContent = context.config.description;
riskChip.textContent = context.config.chip;

if (context.target) {
  targetHost.textContent = context.target.hostname;
  targetHost.title = context.target.href;
  dialogHost.textContent = context.target.hostname;
  dialogHost.title = context.target.href;
} else {
  targetHost.textContent = "未提供可恢复的原始地址";
  continueRisk.disabled = true;
  technicalNote.textContent =
    "为了避免打开错误地址，本次请求无法使用“继续访问”。你可以返回上一页并提交误报。";
}

safeBack.addEventListener("click", () => {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }
  window.location.replace("about:blank");
});

continueRisk.addEventListener("click", () => {
  if (!context.target) return;
  if (typeof riskDialog.showModal === "function") {
    riskDialog.showModal();
    return;
  }

  const confirmed = window.confirm(
    `确认无视风险并继续访问 ${context.target.hostname}？`,
  );
  if (confirmed) window.location.assign(context.target.href);
});

confirmContinue.addEventListener("click", (event) => {
  event.preventDefault();
  if (!context.target) return;
  window.location.assign(context.target.href);
});

if (context.category === "gambling") {
  standardActions.hidden = true;
  gamblingActions.hidden = false;
  technicalNote.textContent =
    "举报入口由浙江互联网信息办公室主办，可选择“赌博类”提交线索。";

  window.setTimeout(() => {
    window.location.replace(ZHEJIANG_REPORT_URL);
  }, 2200);
}
