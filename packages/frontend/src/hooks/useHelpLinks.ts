import { APP_VERSION, GIT_DATE, GIT_HASH } from "src/env"
import { formatDate } from "src/utils/formatting-utils"

const EMAIL_ADDRESS = "hello@danielconstantin.net"

const BUG_REPORT_TEMPLATE_FILE = "🐛-bug-report.md"
const BUG_REPORT_TEMPLATE_BODY = `**Describe the bug**
A clear and concise description of what the bug is.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Apps affected** (where did it happen?)
- [ ] Web app
- [ ] Mac desktop app
- [ ] Windows desktop app
- [ ] Linux desktop app

**Browser** (if applicable)
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Other: Brave

**Operating system**
- [ ] Windows
- [ ] Mac with Arm CPU
- [ ] Mac with Intel CPU
- [ ] Linux

**Additional context**
Add any other context about the problem here.`

const FEATURE_REQUEST_TEMPLATE_FILE = "💡-feature-request.md"
const FEATURE_REQUEST_TEMPLATE_BODY = `**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.`

const HELP_TEMPLATE_BODY = `**Please describe the thing you need clarification or help with**`

const APP_DETAILS = `App version: \`${APP_VERSION}\`
App digest: \`${GIT_HASH.slice(0, 7)}\`
Build date: \`${formatDate(new Date(GIT_DATE))}\``

export function useHelpLinks() {
  const bugBody = `${BUG_REPORT_TEMPLATE_BODY}\n\n${APP_DETAILS}`
  const bugGitHubUrl = `https://github.com/privatefolio/privatefolio/issues/new?template=${encodeURIComponent(
    BUG_REPORT_TEMPLATE_FILE
  )}&body=${encodeURIComponent(bugBody)}`

  const bugEmailSubject = "Bug report: <brief description>"
  const bugEmailBody = `${BUG_REPORT_TEMPLATE_BODY}\n\n${APP_DETAILS}`
  const bugEmailUrl = `mailto:${EMAIL_ADDRESS}?subject=${encodeURIComponent(
    bugEmailSubject
  )}&body=${encodeURIComponent(bugEmailBody)}`

  const featureBody = `${FEATURE_REQUEST_TEMPLATE_BODY}\n\n${APP_DETAILS}`
  const featureGitHubUrl = `https://github.com/privatefolio/privatefolio/issues/new?template=${encodeURIComponent(
    FEATURE_REQUEST_TEMPLATE_FILE
  )}&body=${encodeURIComponent(featureBody)}`

  const featureEmailSubject = "Feature request: <brief description>"
  const featureEmailBody = `${FEATURE_REQUEST_TEMPLATE_BODY}\n\n${APP_DETAILS}`
  const featureEmailUrl = `mailto:${EMAIL_ADDRESS}?subject=${encodeURIComponent(
    featureEmailSubject
  )}&body=${encodeURIComponent(featureEmailBody)}`

  const questionEmailSubject = "Question: <brief description>"
  const questionEmailBody = `${HELP_TEMPLATE_BODY}\n\n${APP_DETAILS}`
  const questionEmailUrl = `mailto:${EMAIL_ADDRESS}?subject=${encodeURIComponent(
    questionEmailSubject
  )}&body=${encodeURIComponent(questionEmailBody)}`
  const questionDiscordUrl = "https://discord.gg/YHHu9nK8VD"

  return {
    bugEmailUrl,
    bugGitHubUrl,
    featureEmailUrl,
    featureGitHubUrl,
    questionDiscordUrl,
    questionEmailUrl,
  }
}
