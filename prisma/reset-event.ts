/**
 * Resets the competition after a dry run.
 *
 *   npm run event:reset                     -> preview only, changes nothing
 *   npm run event:reset -- --yes            -> event back to NOT_STARTED (teams kept)
 *   npm run event:reset -- --wipe-teams --yes
 *                                           -> also deletes ALL teams and their progress,
 *                                              flags and submissions
 *
 * Challenges and the admin account are never touched.
 */
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const args = process.argv.slice(2);
const confirmed = args.includes('--yes');
const wipeTeams = args.includes('--wipe-teams');

async function main() {
  const prisma = new PrismaClient();
  try {
    const event = await prisma.event.findFirst();
    const teams = await prisma.team.count();
    const submissions = await prisma.submission.count();
    const host = (process.env.DATABASE_URL || '').split('@')[1]?.split('/')[0] ?? 'unknown';

    console.log(`Database: ${host}`);
    console.log(`Event status: ${event?.status ?? 'none'} | Teams: ${teams} | Submissions: ${submissions}`);
    console.log('');
    console.log('This will:');
    console.log(`  - set the event to NOT_STARTED with a ${event?.durationMinutes ?? 60}-minute timer`);
    console.log(
      wipeTeams
        ? `  - DELETE all ${teams} team(s) and ${submissions} submission(s) (cannot be undone)`
        : '  - keep all teams (use --wipe-teams to delete them)'
    );

    if (!confirmed) {
      console.log('\nPreview only. Nothing was changed. Re-run with --yes to apply.');
      return;
    }

    if (wipeTeams) {
      // Cascades to members, progress, physical flags and submissions
      await prisma.submission.deleteMany();
      await prisma.team.deleteMany();
    }

    if (event) {
      await prisma.event.update({
        where: { id: event.id },
        data: {
          status: 'NOT_STARTED',
          startTime: null,
          endTime: null,
          remainingSecondsWhenPaused: null,
          isLeaderboardVisible: true,
        },
      });
    }

    console.log('\nDone. Event is NOT_STARTED' + (wipeTeams ? ' and all teams were deleted.' : '.'));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
