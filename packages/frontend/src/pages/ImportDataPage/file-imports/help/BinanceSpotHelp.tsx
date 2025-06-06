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
        Log in to your Binance account. Afterwards, mouseover the profile icon and click on{" "}
        <ExternalLink href="https://www.binance.com/en/my/wallet/history/all-crypto">
          Orders
        </ExternalLink>
        {/* TODO7 screenshot is outdated */}
      </>
    ),
    label: "Visit the Orders page",
  },
  {
    description: (
      <>
        On the Orders page, navigate to{" "}
        <ExternalLink href="https://www.binance.com/en/my/wallet/history/all-crypto">
          Trade History
        </ExternalLink>
        {/* TODO7 screenshot is outdated */}
      </>
    ),
    label: "Visit the Trade History tab",
  },
  {
    description: (
      <>
        Mouseover the export icon and click on <u>Export Trade History</u>.
        <br />
        <br />
        <a
          href="https://public.bnbstatic.com/image/cms/article/body/202204/dadda0c4657590c96a5f2a76eedb6737.png"
          target="_blank"
          rel="noreferrer"
        >
          <img
            height={203}
            width={433}
            // width="100%"
            src="https://public.bnbstatic.com/image/cms/article/body/202204/dadda0c4657590c96a5f2a76eedb6737.png"
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
          href="https://public.bnbstatic.com/image/cms/article/body/202204/f261f1b2be0f7d5e5ba4a170d48d2647.png"
          target="_blank"
          rel="noreferrer"
        >
          <img
            height={217}
            width={433}
            // width="100%"
            src="https://public.bnbstatic.com/image/cms/article/body/202204/f261f1b2be0f7d5e5ba4a170d48d2647.png"
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
          href="https://public.bnbstatic.com/image/cms/article/body/202204/3c004cfae75a1447a1ca031c81289bc1.png"
          target="_blank"
          rel="noreferrer"
        >
          <img
            height={217}
            width={433}
            src="https://public.bnbstatic.com/image/cms/article/body/202204/3c004cfae75a1447a1ca031c81289bc1.png"
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
        Once completed, reopen the <u>Export Trade History</u> pop-up and click on <u>Download</u>.
        <br />
        <br />
        <a
          href="https://public.bnbstatic.com/image/cms/article/body/202204/2f05f5f78c1a942aa28c4ef447ad4d27.png"
          target="_blank"
          rel="noreferrer"
        >
          <img
            height={220}
            width={433}
            src="https://public.bnbstatic.com/image/cms/article/body/202204/2f05f5f78c1a942aa28c4ef447ad4d27.png"
            alt="Step visualization"
          />
        </a>
      </>
    ),
    label: "Download",
  },
]

export function BinanceSpotHelp() {
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
        sx={{ paddingX: 2 }}
        variant="caption"
        href="https://www.binance.com/en/support/faq/how-to-download-spot-trading-transaction-history-statement-e4ff64f2533f4d23a0b3f8f17f510eab"
      >
        Visit official binance guide
      </ExternalLink>
    </>
  )
}
