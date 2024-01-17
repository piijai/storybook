import chalk from 'chalk';
import boxen from 'boxen';
import { dedent } from 'ts-dedent';
import type { FixSummary } from '../types';
import { FixStatus } from '../types';
import type { InstallationMetadata } from '../../js-package-manager/types';
import { getDuplicatedDepsWarnings } from '../../doctor/getDuplicatedDepsWarnings';

export const messageDivider = '\n\n';
const segmentDivider = '\n\n─────────────────────────────────────────────────\n\n';

function getGlossaryMessages(
  fixSummary: FixSummary,
  fixResults: Record<string, FixStatus>,
  logFile: string
) {
  const messages = [];
  if (fixSummary.succeeded.length > 0) {
    messages.push(chalk.bold('Successful migrations:'));
    messages.push(fixSummary.succeeded.map((m) => chalk.green(m)).join(', '));
  }

  if (Object.keys(fixSummary.failed).length > 0) {
    messages.push(chalk.bold('Failed migrations:'));
    messages.push(
      Object.entries(fixSummary.failed)
        .map(([id, error]) => {
          return `${chalk.redBright(id)}:\n${error}`;
        })
        .join('\n')
    );
    messages.push(`You can find the full logs in ${chalk.cyan(logFile)}`);
  }

  if (fixSummary.manual.length > 0) {
    messages.push(chalk.bold('Manual migrations:'));
    messages.push(
      fixSummary.manual
        .map((m) => (fixResults[m] === FixStatus.MANUAL_SUCCEEDED ? chalk.green(m) : chalk.blue(m)))
        .join(', ')
    );
  }

  if (fixSummary.skipped.length > 0) {
    messages.push(chalk.bold('Skipped migrations:'));
    messages.push(fixSummary.skipped.map((m) => chalk.cyan(m)).join(', '));
  }

  return messages;
}

export function getMigrationSummary({
  fixResults,
  fixSummary,
  logFile,
  installationMetadata,
}: {
  fixResults: Record<string, FixStatus>;
  fixSummary: FixSummary;
  installationMetadata?: InstallationMetadata | null;
  logFile: string;
}) {
  const messages = [];
  messages.push(getGlossaryMessages(fixSummary, fixResults, logFile).join(messageDivider));

  messages.push(dedent`If you'd like to run the migrations again, you can do so by running '${chalk.cyan(
    'npx storybook@next automigrate'
  )}'
    
    The automigrations try to migrate common patterns in your project, but might not contain everything needed to migrate to the latest version of Storybook.
    
    Please check the changelog and migration guide for manual migrations and more information: ${chalk.yellow(
      'https://storybook.js.org/migration-guides/7.0'
    )}
    And reach out on Discord if you need help: ${chalk.yellow('https://discord.gg/storybook')}
  `);

  const duplicatedDepsMessage = installationMetadata
    ? getDuplicatedDepsWarnings(installationMetadata)
    : getDuplicatedDepsWarnings();

  if (duplicatedDepsMessage) {
    messages.push(duplicatedDepsMessage.join(messageDivider));
  }

  const hasNoFixes = Object.values(fixResults).every((r) => r === FixStatus.UNNECESSARY);
  const hasFailures = Object.values(fixResults).some(
    (r) => r === FixStatus.FAILED || r === FixStatus.CHECK_FAILED
  );

  // eslint-disable-next-line no-nested-ternary
  const title = hasNoFixes
    ? 'No migrations were applicable to your project'
    : hasFailures
    ? 'Migration check ran with failures'
    : 'Migration check ran successfully';

  return boxen(messages.filter(Boolean).join(segmentDivider), {
    borderStyle: 'round',
    padding: 1,
    title,
    borderColor: hasFailures ? 'red' : 'green',
  });
}
