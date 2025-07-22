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
import { AppLink } from "src/components/AppLink"
import { ExternalLink } from "src/components/ExternalLink"

const steps = [
  {
    description: (
      <>
        Log in to your Binance account. Afterwards, mouseover the wallet icon, click on Account and
        then go to{" "}
        <ExternalLink href="https://www.binance.com/en/my/settings/api-management">
          API Management
        </ExternalLink>
        .
        <br />
        <br />
        <AppLink href="https://public.bnbstatic.com/image/cms/article/body/202503/318a1f12ee5fd78036a6b10162cc0b7c.png">
          <img
            // width="100%" FIXME TODO0 this is to avoid layout jumps
            height={400}
            width={306}
            src="https://public.bnbstatic.com/image/cms/article/body/202503/318a1f12ee5fd78036a6b10162cc0b7c.png"
            alt="Step visualization"
          />
        </AppLink>
        <br />
        <br />
        <AppLink href="https://public.bnbstatic.com/image/cms/article/body/202503/0fc80b025fea0b65813aad616ed56ca7.png">
          <img
            // width="100%" FIXME TODO0 this is to avoid layout jumps
            height={185}
            width={400}
            src="https://public.bnbstatic.com/image/cms/article/body/202503/0fc80b025fea0b65813aad616ed56ca7.png"
            alt="Step visualization"
          />
        </AppLink>
      </>
    ),
    label: "Visit the API management page",
  },
  {
    description: (
      <>
        Click on <b>Create Tax Report API</b>.
        <br />
        <br />
        <AppLink href="https://public.bnbstatic.com/image/cms/article/body/202311/d3e513ab89bb7beba3fcf11e140bbe1c.png">
          <img
            // width="100%" FIXME TODO0 this is to avoid layout jumps
            height={93}
            width={420}
            src="https://public.bnbstatic.com/image/cms/article/body/202311/d3e513ab89bb7beba3fcf11e140bbe1c.png"
            alt="Step visualization"
          />
        </AppLink>
      </>
    ),
    label: "Create a Tax report API key",
  },
  {
    description: (
      <>
        Verify your request with 2FA devices or passkeys.
        <br />
        <br />
        <AppLink href="https://public.bnbstatic.com/image/cms/article/body/202311/8baa2ba8fb25db05f8dabbd51770c19c.png">
          <img
            // width="100%" FIXME TODO0 this is to avoid layout jumps
            height={399}
            width={420}
            src="https://public.bnbstatic.com/image/cms/article/body/202311/8baa2ba8fb25db05f8dabbd51770c19c.png"
            alt="Step visualization"
          />
        </AppLink>
      </>
    ),
    label: "Verify your request with 2FA",
  },
  {
    description: (
      <>
        Your API key and API secret will be displayed.
        <br />
        Store these keys in a secure password manager or encrypted file, or directly into the{" "}
        <b>Privatefolio</b> app.
        <br />
        <br />
        <AppLink href="https://public.bnbstatic.com/image/cms/article/body/202311/994407a18b399e9cdcaf1593a8d13d6b.png">
          <img
            // width="100%" FIXME TODO0 this is to avoid layout jumps
            height={217}
            width={420}
            src="https://public.bnbstatic.com/image/cms/article/body/202311/994407a18b399e9cdcaf1593a8d13d6b.png"
            alt="Step visualization"
          />
        </AppLink>
      </>
    ),
    label: "Save your API credentials",
  },
]

export default function BinanceConnectionHelp() {
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
              <StepLabel>{step.label}</StepLabel>
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
              Now you can connect your Binance account to Privatefolio.
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
      <Box sx={{ marginTop: 1, paddingX: 2 }}>
        <ExternalLink
          variant="caption"
          href="https://www.binance.com/en/support/faq/detail/538e05e2fd394c489b4cf89e92c55f70"
        >
          Visit official binance guide
        </ExternalLink>
        <br />
        <ExternalLink
          variant="caption"
          href="https://www.binance.com/en/my/settings/api-management"
        >
          Go to API management
        </ExternalLink>
      </Box>
    </>
  )
}
