const turkuRepo = require('../repositories/turkuRepository');
const analysisRepo = require('../repositories/analysisRepository');
const userRepo = require('../repositories/userRepository');

const statsService = {
  getPlatformStats() {
    const totalTurkus = turkuRepo.count();
    const analyzedTurkus = analysisRepo.countDistinctAnalyzedTurkus();
    const pendingTurkus = totalTurkus - analyzedTurkus;

    const totalAnalyses = analysisRepo.countAll();
    const completedAnalyses = analysisRepo.countByStatus('completed');
    const draftAnalyses = analysisRepo.countByStatus('draft');

    const totalUsers = userRepo.count();
    const activeAnalysts = analysisRepo.countActiveAnalysts();

    const completionRate = totalTurkus > 0
      ? Math.round((analyzedTurkus / totalTurkus) * 100)
      : 0;

    const withLyrics = turkuRepo.countWithLyrics();
    const withoutLyrics = turkuRepo.countWithoutLyrics();

    const recentCompleted = analysisRepo.recentCompleted(10);
    const userStats = analysisRepo.userStats();

    return {
      turkus: { total: totalTurkus, analyzed: analyzedTurkus, pending: pendingTurkus },
      analyses: { total: totalAnalyses, completed: completedAnalyses, draft: draftAnalyses },
      users: { total: totalUsers, activeAnalysts },
      lyrics: { withLyrics, withoutLyrics },
      completionRate,
      recentCompleted,
      userStats,
    };
  },
};

module.exports = statsService;
