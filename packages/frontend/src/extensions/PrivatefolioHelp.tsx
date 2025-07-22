import {
  Box,
  Button,
  Link,
  Paper,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material"
import * as React from "react"
import { AppLink } from "src/components/AppLink"
import { ExternalLink } from "src/components/ExternalLink"
import { resolveUrl } from "src/utils/utils"

const steps = [
  {
    description: (
      <>
        Get in the account whose data you want to export. Afterwards open the Navigation Menu and
        click on{" "}
        <ExternalLink href="https://privatefolio.app/c/0/transactions">Transactions</ExternalLink>.
        <br />
        <br />
        <AppLink href={resolveUrl("$STATIC_ASSETS/help/privatefolio/Step1.png")}>
          <img
            height={201}
            width={433}
            src={resolveUrl("$STATIC_ASSETS/help/privatefolio/Step1.png")}
            alt="Step visualization"
          />
        </AppLink>
      </>
    ),
    label: "Visit the transactions page",
  },
  {
    description: (
      <>
        Click on Actions. You can select <u>Export all transactions</u> if you want to export all
        the transactions from this account.
        <br />
        <br />
        <AppLink href={resolveUrl("$STATIC_ASSETS/help/privatefolio/Step2.png")}>
          <img
            height={201}
            width={433}
            src={resolveUrl("$STATIC_ASSETS/help/privatefolio/Step2.png")}
            alt="Step visualization"
          />
        </AppLink>
      </>
    ),
    label: "Export all the transactions",
  },
]

export default function PrivatefolioHelp() {
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
    </>
  )
}
