import { Link } from "@mui/material"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Paper from "@mui/material/Paper"
import Step from "@mui/material/Step"
import StepContent from "@mui/material/StepContent"
import StepLabel from "@mui/material/StepLabel"
import Stepper from "@mui/material/Stepper"
import Typography from "@mui/material/Typography"
import * as React from "react"
import { ExternalLink } from "src/components/ExternalLink"

const steps = [
  {
    description: (
      <>
        Log in to your Binance account. Afterwards, mouseover the wallet icon and click on{" "}
        <ExternalLink href="https://www.binance.com/en/my/wallet/history/all-crypto">
          Transaction History
        </ExternalLink>
        .
        <br />
        <br />
        <a
          href="https://public.bnbstatic.com/image/cms/article/body/202401/66f3d1ab78ec47cd25bc7f1f47681fe0.png"
          target="_blank"
          rel="noreferrer"
        >
          <img
            // width="100%" FIXME TODO0 this is to avoid layout jumps
            height={201}
            width={433}
            src="https://public.bnbstatic.com/image/cms/article/body/202401/66f3d1ab78ec47cd25bc7f1f47681fe0.png"
            alt="Step visualization"
          />
        </a>
      </>
    ),
    label: "Visit the transaction history page",
  },
  {
    description: (
      <>
        Mouseover the export icon and click on <u>Export Transaction Records</u>.
        <br />
        <br />
        <a
          href="https://public.bnbstatic.com/image/cms/article/body/202401/7f5790d524eeb91156ff2cd2e0f26972.png"
          target="_blank"
          rel="noreferrer"
        >
          <img
            height={203}
            width={433}
            // width="100%"
            src="https://public.bnbstatic.com/image/cms/article/body/202401/7f5790d524eeb91156ff2cd2e0f26972.png"
            alt="Step visualization"
          />
        </a>
      </>
    ),
    label: "Open the export pop-up",
  },
  {
    description: (
      <>
        Select the time range (up to 12 months) and click on <u>Generate</u>.
        <br />
        <br />
        <a
          href="https://public.bnbstatic.com/image/cms/article/body/202401/a8d16a3f1114ae1bc62ff84e8affdd07.png"
          target="_blank"
          rel="noreferrer"
        >
          <img
            height={415}
            width={433}
            src="https://public.bnbstatic.com/image/cms/article/body/202401/a8d16a3f1114ae1bc62ff84e8affdd07.png"
            alt="Step visualization"
          />
        </a>
      </>
    ),
    label: "Request a new export",
  },
  {
    description: (
      <>
        Next step is to simply wait until the export is generated, you will receive an email
        reminder.
        <br />
        <br />
        <a
          href="https://public.bnbstatic.com/image/cms/article/body/202401/3e36984bc3e1bde5f0fd5cb8db8d1987.png"
          target="_blank"
          rel="noreferrer"
        >
          <img
            height={419}
            width={433}
            src="https://public.bnbstatic.com/image/cms/article/body/202401/3e36984bc3e1bde5f0fd5cb8db8d1987.png"
            alt="Step visualization"
          />
        </a>
      </>
    ),
    label: "Wait for completion",
  },
  {
    description: (
      <>
        Once completed, reopen the <u>Export Transaction Records</u> pop-up and click on{" "}
        <u>Download</u>.
        <br />
        <br />
        <a
          href="https://public.bnbstatic.com/image/cms/article/body/202401/0b6cb437fc9d280c3ddbe4466e7d5069.png"
          target="_blank"
          rel="noreferrer"
        >
          <img
            height={421}
            width={433}
            src="https://public.bnbstatic.com/image/cms/article/body/202401/0b6cb437fc9d280c3ddbe4466e7d5069.png"
            alt="Step visualization"
          />
        </a>
      </>
    ),
    label: "Download",
  },
]

export default function BinanceHelp() {
  const [activeStep, setActiveStep] = React.useState(0)

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }

  const handleReset = () => {
    setActiveStep(0)
  }

  return (
    <>
      <Paper sx={{ paddingX: 2, paddingY: 1 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel
              // optional={index === 2 ? <Typography variant="caption">Last step</Typography> : null}
              >
                {step.label}
              </StepLabel>
              <StepContent>
                <Typography variant="body2">{step.description}</Typography>
                <Box sx={{ marginTop: 2 }}>
                  <div>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      sx={{ marginRight: 1, marginTop: 1 }}
                    >
                      {index === steps.length - 1 ? "Finish" : "Continue"}
                    </Button>
                    <Button
                      disabled={index === 0}
                      onClick={handleBack}
                      sx={{ marginRight: 1, marginTop: 1 }}
                    >
                      Back
                    </Button>
                  </div>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
        {activeStep === steps.length && (
          <Box paddingTop={2}>
            <Typography variant="body2">Congratulations!</Typography>
            <Typography variant="body2" color="text.secondary">
              Now you can drag and drop the files to Privatefolio to get started.
            </Typography>
            <br />
            <Link
              onClick={handleReset}
              sx={{ cursor: "pointer", marginTop: 1 }}
              variant="body2"
              underline="hover"
              color="text.secondary"
            >
              Retake the steps.
            </Link>
          </Box>
        )}
      </Paper>
      <ExternalLink
        sx={{ marginTop: 1, paddingX: 2 }}
        variant="caption"
        href="https://www.binance.com/en/support/faq/how-to-generate-transaction-history-990afa0a0a9341f78e7a9298a9575163"
      >
        Visit official binance guide
      </ExternalLink>
    </>
  )
}
