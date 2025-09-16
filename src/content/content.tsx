import { createRoot } from "react-dom/client";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { emailDetection } from "../utils/emailDetection";
import { storageUtils } from "../utils/storage";
import { PromptGuardProvider } from "../context/PromptGuardContext";
import PromptGuardModal from "../components/PromptGuardModal";

const theme = createTheme({
  palette: {
    mode: "light",
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "inherit",
          color: "inherit",
        },
      },
    },
    MuiModal: {
      styleOverrides: {
        root: {
          position: "fixed",
          zIndex: 10001,
        },
      },
    },
  },
});

class PromptGuardContentScript {
  private modalContainer: HTMLDivElement | null = null;
  private root: ReturnType<typeof createRoot> | null = null;
  private isModalOpen = false;
  private promptEditor: HTMLDivElement | null = null;
  private lastCapturedText: string = "";

  constructor() {
    this.init();
  }

  private async init() {
    await this.waitForChatGPTLoad();

    this.setupSubmitButtonMonitoring();

    this.createModalContainer();
  }

  private async waitForChatGPTLoad(): Promise<void> {
    return new Promise((resolve) => {
      const checkForElements = () => {
        const editor = document.querySelector(
          "#prompt-textarea"
        ) as HTMLDivElement;
        if (editor) {
          this.promptEditor = editor;
          resolve();
        } else {
          setTimeout(checkForElements, 500);
        }
      };
      checkForElements();
    });
  }

  private setupSubmitButtonMonitoring() {
    this.startTextCapture();

    document.addEventListener(
      "click",
      async (event) => {
        const target = event.target as HTMLElement;

        if (target.closest("#prompt-guard-modal-container")) {
          return;
        }

        if (this.isSubmitButton(target)) {
          this.captureCurrentText();
          await this.handleSubmitClick();
        }
      },
      true
    );

    if (this.promptEditor) {
      this.promptEditor.addEventListener("keydown", async (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          this.captureCurrentText();
          await this.handleSubmitClick();
        }
      });
    }

    document.addEventListener(
      "submit",
      async (event) => {
        const form = event.target as HTMLFormElement;
        if (
          form.classList.contains("group/composer") ||
          form.getAttribute("data-type") === "unified-composer"
        ) {
          this.captureCurrentText();
          await this.handleSubmitClick();
        }
      },
      true
    );
  }

  private startTextCapture() {
    if (this.promptEditor) {
      this.promptEditor.addEventListener("input", () => {
        this.captureCurrentText();
      });
    }
  }

  private captureCurrentText() {
    if (!this.promptEditor) return;

    const currentText = this.extractTextFromElement(this.promptEditor).trim();
    if (currentText) {
      this.lastCapturedText = currentText;
    }
  }

  private isSubmitButton(element: HTMLElement): boolean {
    if (element.id === "composer-submit-button") {
      return true;
    }

    const parentButton = element.closest("button#composer-submit-button");
    if (parentButton) {
      return true;
    }

    return false;
  }

  private extractTextFromElement(element: HTMLElement): string {
    let text = "";

    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent || "";
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const childElement = node as HTMLElement;

        if (
          ["P", "DIV", "BR", "H1", "H2", "H3", "H4", "H5", "H6"].includes(
            childElement.tagName
          )
        ) {
          if (text && !text.endsWith(" ") && !text.endsWith("\n")) {
            text += " ";
          }
        }

        text += this.extractTextFromElement(childElement);

        if (["P", "DIV"].includes(childElement.tagName)) {
          if (!text.endsWith(" ") && !text.endsWith("\n")) {
            text += " ";
          }
        }
      }
    }

    return text;
  }

  private async handleSubmitClick() {
    if (!this.promptEditor || !this.lastCapturedText) return;

    const detection = emailDetection.detectEmails(this.lastCapturedText);

    if (detection.hasEmails) {
      for (const email of detection.emails) {
        await storageUtils.addDetectedEmail(email);
      }

      const activeIssues = await storageUtils.getActiveIssues();
      const recentEmails = activeIssues.filter((issue) =>
        detection.emails.includes(issue.email)
      );

      if (recentEmails.length > 0) {
        setTimeout(() => this.showModal(), 500);
      }
    }
  }

  private createModalContainer() {
    this.modalContainer = document.createElement("div");
    this.modalContainer.id = "prompt-guard-modal-container";
    this.modalContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10000;
      pointer-events: none;
    `;
    document.body.appendChild(this.modalContainer);

    this.root = createRoot(this.modalContainer);
  }

  private showModal() {
    if (this.isModalOpen || !this.root) return;

    this.isModalOpen = true;
    this.modalContainer!.style.pointerEvents = "none";

    this.root.render(
      <ThemeProvider theme={theme}>
        <PromptGuardProvider>
          <div style={{ pointerEvents: "auto" }}>
            <PromptGuardModal open={true} onClose={this.hideModal.bind(this)} />
          </div>
        </PromptGuardProvider>
      </ThemeProvider>
    );
  }

  private hideModal() {
    if (!this.isModalOpen || !this.root) return;

    this.isModalOpen = false;
    this.modalContainer!.style.pointerEvents = "none";

    this.root.render(null);
  }
}

new PromptGuardContentScript();
