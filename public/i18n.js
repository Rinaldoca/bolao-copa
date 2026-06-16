/* ─── Translations ───────────────────────────────────────────────────────── */
const LANG_DATA = {
  pt: {
    date_locale: 'pt-BR',

    // Header
    logo_sub: 'Copa do Mundo 2026',
    login_btn: 'Entrar',

    // Tabs
    tab_lb: '🏆 Placar',
    tab_bracket: '🗂 Chaveamento',
    tab_matches: '⚽ Partidas',
    tab_me: '👤 Eu',
    tab_admin: '⚙️ Admin',

    // Leaderboard
    lb_title: 'Placar',
    lb_subtitle: '🎯 Exato <strong>3 pts</strong> &nbsp;·&nbsp; ✅ Resultado <strong>1 pt</strong> &nbsp;·&nbsp; 🏆 Campeão <strong>10 pts</strong> &nbsp;·&nbsp; ⚽ Artilheiro <strong>5 pts</strong>',
    lb_general: 'Geral',
    lb_empty: 'Ninguém no placar ainda.',
    lb_col_player: 'Jogador',
    lb_col_pts: 'Pts',
    lb_bets_1: 'palpite',
    lb_bets_n: 'palpites',

    // Rules
    rules_title: '📋 Como funciona o bolão',
    rules_3pts: '3 pts',
    rules_exact_title: '🎯 Placar exato',
    rules_exact_desc: 'Acertou o resultado e o número de gols de cada time.',
    rules_1pt: '1 pt',
    rules_result_title: '✅ Resultado certo',
    rules_result_desc: 'Acertou quem ganhou ou que deu empate, mas errou o placar.',
    rules_10pts: '10 pts',
    rules_champ_title: '🏆 Campeão',
    rules_champ_desc: 'Acertou o time campeão do Mundial.',
    rules_5pts: '5 pts',
    rules_scorer_title: '⚽ Artilheiro',
    rules_scorer_desc: 'Acertou o jogador com mais gols no torneio.',
    rules_lock: '⏱ Apostas fecham <strong>5 minutos antes</strong> de cada jogo começar. Palpites de campeão e artilheiro são controlados pelo admin.',

    // Section dividers
    div_awards: '🏅 Destaques do Grupo',
    div_difficulty: '🎲 Dificuldade dos Jogos',
    div_history: '📈 Disputa pela Liderança',
    div_special: '🏆 Palpites de Campeão &amp; Artilheiro',
    div_feed: '⚡ Feed de Resultados',
    div_my_bets: 'Meus Palpites',
    div_stats: '📊 Estatísticas Detalhadas',

    // Bracket tab
    bracket_title: 'Chaveamento',
    bracket_groups: '📊 Grupos',
    bracket_thirds: '🥉 Terceiros',
    bracket_bracket: '🏆 Chaveamento',
    bracket_note: 'As partidas são adicionadas pelo admin conforme os times se classificam.',
    bracket_empty_title: 'Fase eliminatória a caminho',
    bracket_empty_sub: 'As partidas serão adicionadas pelo admin conforme os times se classificam.',
    bracket_third_place: '🥉 Terceiro Lugar',
    bracket_tbd: 'A definir',
    bracket_bets_closed: '⏳ apostas encerradas',

    // Stage names (display)
    stage_groups: 'Fase de Grupos',
    stage_32: '32 avos de Final',
    stage_16: 'Oitavas de Final',
    stage_qf: 'Quartas de Final',
    stage_sf: 'Semifinal',
    stage_3rd: 'Terceiro Lugar',
    stage_final: 'Final',

    // Stage short labels (for charts/bars)
    stage_short_groups: 'Grupos',
    stage_short_32: '32 avos',
    stage_short_16: 'Oitavas',
    stage_short_qf: 'Quartas',
    stage_short_sf: 'Semi',
    stage_short_3rd: '3º Lugar',
    stage_short_final: 'Final',

    // Group standings
    standings_group: 'Grupo',
    standings_qualified: '1º e 2º classificados',
    standings_third: '3º lugar',
    standings_col_team: 'Seleção',
    standings_empty: 'Nenhuma partida da fase de grupos cadastrada.',
    thirds_sub: 'As <strong>8 melhores</strong> terceiras colocadas (de 12 grupos) avançam para as oitavas de final.',
    thirds_col_group: 'Gr',
    thirds_advances: 'Avança para as oitavas',
    thirds_eliminated: 'Eliminado',

    // Matches tab
    matches_title: 'Partidas',
    betting_as: 'Apostando como:',
    filter_all: 'Todas',
    filter_open: 'Abertas',
    filter_finished: 'Encerradas',
    all_stages: 'Todas etapas',
    view_grouped: '📊 Por Grupo',
    view_chrono: '📅 Cronológico',
    no_bet_filter: '🎯 Sem palpite',
    randomize_btn: '🎲 Randomizar',
    clear_bets_btn: '🗑 Limpar',
    matches_empty: 'Nenhuma partida encontrada.',
    group_open: 'abertas',
    group_done: 'encerradas',

    // Match card badges
    badge_open: 'Aberto',
    badge_closing: 'Em breve',
    badge_finished: 'Encerrado',

    // Match card
    bet_label: 'Palpite:',
    no_bet_msg: 'Sem palpite',
    bets_closed_no_bet: '⏳ Apostas encerradas',
    bets_closed_with_bet: '⏳ Apostas encerradas · Palpite:',
    login_to_bet_link: 'Entre',
    login_to_bet_suffix: 'para apostar',

    // Bet toggle
    bets_placed: 'apostaram',
    view_bets: 'Ver palpites',

    // Bet stats
    bet_stats_trend: 'Tendência',
    bet_stats_home: 'Casa',
    bet_stats_draw: 'Emp',
    bet_stats_away: 'Visit',
    bet_stats_avg_goals: 'média de gols',
    bet_stats_top_score: 'placar mais apostado',
    bet_stats_biggest: 'maior goleada prevista',

    // All bets section
    bets_loading: 'Carregando...',
    bets_none: 'Nenhum palpite.',

    // Me section
    me_no_user: 'Selecione seu perfil para ver sua página.',
    me_enter_btn: 'Entrar',
    me_pts: 'pontos',
    me_exact: '🎯 Exatos',
    me_results: '✅ Certos',
    me_accuracy: 'Acerto',
    me_champ_title: '🏆 Meu palpite de campeão',
    me_scorer_title: '⚽ Meu palpite de artilheiro',
    me_no_bet_placed: 'Sem palpite',
    me_scorer_placeholder: 'Nome do jogador',
    me_bet_label: 'Palpite:',
    me_score_label: 'Placar:',
    me_no_bets: 'Nenhum palpite ainda.',
    me_correct: '✓ Acertou! +{pts} pts',
    me_wrong: '✗ Era {val}',

    // Player modal
    pm_points: 'pontos',
    pm_exact: '🎯 exatos',
    pm_results: '✅ certos',
    pm_champion: '🏆 Campeão',
    pm_scorer: '⚽ Artilheiro',
    pm_no_bets: 'Sem palpites ainda.',
    pm_loading: 'Carregando...',
    pm_rivalry: '⚔️ vs você',
    pm_you: 'Você:',
    pm_win: 'V',
    pm_draw: 'E',
    pm_loss: 'D',
    pm_h2h_detail: 'Jogo a jogo',

    // Match difficulty
    diff_empty: 'Nenhum jogo finalizado ainda.',
    diff_correct: 'acertaram o resultado',
    diff_exact: 'acertaram o placar exato',
    diff_bets: 'palpites',
    diff_hardest: '🔴 Mais difíceis',
    diff_easiest: '🟢 Mais fáceis',
    diff_sorted: 'ordenado do mais difícil ao mais fácil',

    // Special bets
    special_open: '🟢 Apostas abertas',
    special_closed: '🔒 Apostas encerradas',
    special_no_bets: 'Nenhum palpite ainda.',
    special_champion: '🏆 Campeão',
    special_scorer: '⚽ Artilheiro',
    special_your_pick: 'Seu palpite',
    special_not_placed: 'Você ainda não apostou.',
    special_change: 'Alterar em Minha Página',
    special_place_bet: 'Apostar agora',
    special_bet_count: 'já apostaram (revelado quando fechar)',

    // Share
    share_lb: 'Compartilhar classificação',
    share_copied: '📋 Classificação copiada!',

    // Team stats
    team_stats_title: '🗺 Desempenho por Time',
    team_stats_best: 'Melhores acertos',
    team_stats_worst: 'Piores acertos',

    // Feed
    feed_empty: 'Nenhum resultado registrado ainda.',
    feed_no_bets: 'Sem palpites.',
    feed_champion: '🏆 Campeão:',
    feed_scorer: '⚽ Artilheiro:',

    // History chart
    history_empty: 'Nenhum resultado registrado ainda.',
    history_no_participants: 'Nenhum participante ainda.',

    // Awards
    award_exact_king: 'Rei do Placar Exato',
    award_streak: 'Maior Sequência',
    award_consistent: 'Mais Consistente',
    award_no_data: 'Sem dados ainda',
    award_active_streak: 'sequência ativa',
    award_best_streak: 'melhor:',
    award_min_games: 'mín. 3 jogos ·',
    award_analyzed: 'analisados',
    award_bad_run: 'Pior Fase',
    award_bad_run_active: 'sequência de erros ativa',
    award_bad_run_worst: 'pior sequência do grupo',

    // Detailed stats
    dstat_streak_title: '🔥 Sequência atual',
    dstat_streak_best: 'melhor:',
    dstat_avg_title: '📈 Média de pontos',
    dstat_avg_sub: 'por jogo encerrado',
    dstat_goals_title: '⚽ Gols previstos',
    dstat_goals_real: 'real:',
    dstat_above_avg: 'acima',
    dstat_below_avg: 'abaixo',
    dstat_on_avg: 'na média',
    dstat_analyzed_title: '🎯 Jogos analisados',
    dstat_analyzed_sub: 'com resultado',
    dstat_by_stage: 'Pontos por fase',
    dstat_style: 'Estilo de apostas',
    dstat_home: 'Casa',
    dstat_draw: 'Empate',
    dstat_away: 'Visitante',

    // Champion picker
    cp_placeholder: 'Escolha a seleção...',
    cp_search: '🔍  Buscar seleção...',

    // User modal
    um_title: 'Selecionar jogador',
    um_or: 'ou crie seu perfil',
    um_placeholder: 'Seu nome',
    um_create: 'Criar',
    um_loading: 'Carregando...',
    um_no_players: 'Nenhum jogador ainda.',

    // Toasts
    toast_expired: 'Sua sessão expirou. Selecione seu perfil novamente.',
    toast_connection: 'Erro de conexão — verifique sua internet',
    toast_select_profile: 'Selecione seu perfil primeiro',
    toast_fill_scores: 'Preencha os dois placares',
    toast_bet_saved: 'Palpite salvo! ✓',
    toast_no_open: 'Sem jogos abertos sem palpite',
    toast_champ_saved: 'Palpite de campeão salvo! 🏆',
    toast_scorer_saved: 'Palpite de artilheiro salvo! ⚽',
    toast_choose_team: 'Escolha um time',
    toast_fill_player: 'Informe o jogador',
    toast_clear_confirm: 'Apagar todos os seus palpites em jogos que ainda não começaram?\n\nEssa ação não pode ser desfeita.',
    toast_clear_result: 'Resultado removido ✓',

    // Bottom nav
    bnav_lb: 'Placar',
    bnav_bracket: 'Bracket',
    bnav_matches: 'Partidas',
    bnav_me: 'Eu',
    bnav_compare: 'Comparar',

    // Next bet card
    next_bet_title: 'Próximo sem palpite',
    next_bet_closes: 'fecha em',
    next_bet_btn: 'Apostar',

    // Player modal full compare
    pm_full_compare: 'Ver comparação completa',

    // Compare tab
    tab_compare: '⚔️ Comparar',
    cmp_title: 'Comparar Jogadores',
    cmp_sub: 'Escolha dois jogadores para ver o confronto direto.',
    cmp_pick_player: 'Escolha um jogador...',
    cmp_pick_both: 'Selecione dois jogadores para comparar.',
    cmp_points: 'pontos',
    cmp_exact: 'Exatos',
    cmp_results: 'Certos',
    cmp_champ: '🏆 Campeão',
    cmp_scorer: '⚽ Artilheiro',
    cmp_no_pick: '—',
    cmp_h2h_title: 'Confronto direto',
    cmp_h2h_games: 'jogos em comum',
    cmp_h2h_win: 'V',
    cmp_h2h_draw: 'E',
    cmp_h2h_loss: 'D',
    cmp_matches_title: 'Jogo a jogo',
    cmp_no_finished: 'Nenhum jogo encerrado ainda.',
    cmp_pts_label: 'pts',
    cmp_tie: 'Empate',

    // Admin
    admin_title: 'Administração',
    admin_restricted: '🔐 Acesso restrito',
    admin_pwd_hint: 'Digite a senha de administrador para continuar.',
    admin_pwd_placeholder: 'Senha admin',
    admin_enter: 'Entrar',
  },

  en: {
    date_locale: 'en-US',

    // Header
    logo_sub: 'World Cup 2026',
    login_btn: 'Sign in',

    // Tabs
    tab_lb: '🏆 Leaderboard',
    tab_bracket: '🗂 Bracket',
    tab_matches: '⚽ Matches',
    tab_me: '👤 Me',
    tab_admin: '⚙️ Admin',

    // Leaderboard
    lb_title: 'Leaderboard',
    lb_subtitle: '🎯 Exact <strong>3 pts</strong> &nbsp;·&nbsp; ✅ Result <strong>1 pt</strong> &nbsp;·&nbsp; 🏆 Champion <strong>10 pts</strong> &nbsp;·&nbsp; ⚽ Top scorer <strong>5 pts</strong>',
    lb_general: 'Overall',
    lb_empty: 'Nobody on the leaderboard yet.',
    lb_col_player: 'Player',
    lb_col_pts: 'Pts',
    lb_bets_1: 'bet',
    lb_bets_n: 'bets',

    // Rules
    rules_title: '📋 How the pool works',
    rules_3pts: '3 pts',
    rules_exact_title: '🎯 Exact score',
    rules_exact_desc: 'Got the result and exact number of goals for each team.',
    rules_1pt: '1 pt',
    rules_result_title: '✅ Correct result',
    rules_result_desc: 'Got who won or that it was a draw, but missed the score.',
    rules_10pts: '10 pts',
    rules_champ_title: '🏆 Champion',
    rules_champ_desc: 'Got the World Cup champion right.',
    rules_5pts: '5 pts',
    rules_scorer_title: '⚽ Top scorer',
    rules_scorer_desc: 'Got the player with the most goals in the tournament.',
    rules_lock: '⏱ Bets close <strong>5 minutes before</strong> each game starts. Champion and top scorer picks are controlled by the admin.',

    // Section dividers
    div_awards: '🏅 Group Highlights',
    div_difficulty: '🎲 Match Difficulty',
    div_history: '📈 Race to the Top',
    div_special: '🏆 Champion &amp; Top Scorer Picks',
    div_feed: '⚡ Results Feed',
    div_my_bets: 'My Bets',
    div_stats: '📊 Detailed Stats',

    // Bracket tab
    bracket_title: 'Bracket',
    bracket_groups: '📊 Groups',
    bracket_thirds: '🥉 Third Place',
    bracket_bracket: '🏆 Bracket',
    bracket_note: 'Matches are added by the admin as teams qualify.',
    bracket_empty_title: 'Knockout stage coming soon',
    bracket_empty_sub: 'Matches will be added by the admin as teams qualify.',
    bracket_third_place: '🥉 Third Place',
    bracket_tbd: 'TBD',
    bracket_bets_closed: '⏳ bets closed',

    // Stage names (display)
    stage_groups: 'Group Stage',
    stage_32: 'Round of 32',
    stage_16: 'Round of 16',
    stage_qf: 'Quarter-finals',
    stage_sf: 'Semi-finals',
    stage_3rd: 'Third Place',
    stage_final: 'Final',

    // Stage short labels
    stage_short_groups: 'Groups',
    stage_short_32: 'R32',
    stage_short_16: 'R16',
    stage_short_qf: 'QF',
    stage_short_sf: 'SF',
    stage_short_3rd: '3rd',
    stage_short_final: 'Final',

    // Group standings
    standings_group: 'Group',
    standings_qualified: '1st & 2nd qualify',
    standings_third: '3rd place',
    standings_col_team: 'Team',
    standings_empty: 'No group stage matches registered.',
    thirds_sub: 'The <strong>8 best</strong> third-placed teams (from 12 groups) advance to the Round of 16.',
    thirds_col_group: 'Grp',
    thirds_advances: 'Advances to Round of 16',
    thirds_eliminated: 'Eliminated',

    // Matches tab
    matches_title: 'Matches',
    betting_as: 'Betting as:',
    filter_all: 'All',
    filter_open: 'Open',
    filter_finished: 'Finished',
    all_stages: 'All stages',
    view_grouped: '📊 By Group',
    view_chrono: '📅 Chronological',
    no_bet_filter: '🎯 No bet',
    randomize_btn: '🎲 Randomize',
    clear_bets_btn: '🗑 Clear',
    matches_empty: 'No matches found.',
    group_open: 'open',
    group_done: 'finished',

    // Match card badges
    badge_open: 'Open',
    badge_closing: 'Closing soon',
    badge_finished: 'Finished',

    // Match card
    bet_label: 'Bet:',
    no_bet_msg: 'No bet',
    bets_closed_no_bet: '⏳ Bets closed',
    bets_closed_with_bet: '⏳ Bets closed · Bet:',
    login_to_bet_link: 'Sign in',
    login_to_bet_suffix: 'to bet',

    // Bet toggle
    bets_placed: 'placed bets',
    view_bets: 'View bets',

    // Bet stats
    bet_stats_trend: 'Trend',
    bet_stats_home: 'Home',
    bet_stats_draw: 'Draw',
    bet_stats_away: 'Away',
    bet_stats_avg_goals: 'avg goals/game',
    bet_stats_top_score: 'most popular score',
    bet_stats_biggest: 'highest-scoring prediction',

    // All bets section
    bets_loading: 'Loading...',
    bets_none: 'No bets yet.',

    // Me section
    me_no_user: 'Select your profile to see your page.',
    me_enter_btn: 'Sign in',
    me_pts: 'points',
    me_exact: '🎯 Exact',
    me_results: '✅ Correct',
    me_accuracy: 'Accuracy',
    me_champ_title: '🏆 My champion pick',
    me_scorer_title: '⚽ My top scorer pick',
    me_no_bet_placed: 'No pick',
    me_scorer_placeholder: 'Player name',
    me_bet_label: 'Bet:',
    me_score_label: 'Score:',
    me_no_bets: 'No bets yet.',
    me_correct: '✓ Correct! +{pts} pts',
    me_wrong: '✗ Was {val}',

    // Player modal
    pm_points: 'points',
    pm_exact: '🎯 exact',
    pm_results: '✅ correct',
    pm_champion: '🏆 Champion',
    pm_scorer: '⚽ Top scorer',
    pm_no_bets: 'No bets yet.',
    pm_loading: 'Loading...',
    pm_rivalry: '⚔️ vs you',
    pm_you: 'You:',
    pm_win: 'W',
    pm_draw: 'D',
    pm_loss: 'L',
    pm_h2h_detail: 'Match by match',

    // Match difficulty
    diff_empty: 'No finished matches yet.',
    diff_correct: 'got the result right',
    diff_exact: 'got the exact score',
    diff_bets: 'bets',
    diff_hardest: '🔴 Hardest',
    diff_easiest: '🟢 Easiest',
    diff_sorted: 'sorted hardest to easiest',

    // Special bets
    special_open: '🟢 Bets open',
    special_closed: '🔒 Bets closed',
    special_no_bets: 'No picks yet.',
    special_champion: '🏆 Champion',
    special_scorer: '⚽ Top scorer',
    special_your_pick: 'Your pick',
    special_not_placed: "You haven't placed your pick yet.",
    special_change: 'Change in My Page',
    special_place_bet: 'Place your pick',
    special_bet_count: 'have picked (revealed when bets close)',

    // Share
    share_lb: 'Share standings',
    share_copied: '📋 Standings copied!',

    // Team stats
    team_stats_title: '🗺 Performance by Team',
    team_stats_best: 'Best accuracy',
    team_stats_worst: 'Worst accuracy',

    // Feed
    feed_empty: 'No results registered yet.',
    feed_no_bets: 'No bets.',
    feed_champion: '🏆 Champion:',
    feed_scorer: '⚽ Top scorer:',

    // History chart
    history_empty: 'No results registered yet.',
    history_no_participants: 'No participants yet.',

    // Awards
    award_exact_king: 'Exact Score King',
    award_streak: 'Best Streak',
    award_consistent: 'Most Consistent',
    award_no_data: 'No data yet',
    award_active_streak: 'active streak',
    award_best_streak: 'best:',
    award_min_games: 'min. 3 games ·',
    award_analyzed: 'analyzed',
    award_bad_run: 'Rough Patch',
    award_bad_run_active: 'active miss streak',
    award_bad_run_worst: "group's longest miss streak",

    // Detailed stats
    dstat_streak_title: '🔥 Current streak',
    dstat_streak_best: 'best:',
    dstat_avg_title: '📈 Avg points',
    dstat_avg_sub: 'per finished game',
    dstat_goals_title: '⚽ Predicted goals',
    dstat_goals_real: 'real:',
    dstat_above_avg: 'above',
    dstat_below_avg: 'below',
    dstat_on_avg: 'on average',
    dstat_analyzed_title: '🎯 Games analyzed',
    dstat_analyzed_sub: 'with result',
    dstat_by_stage: 'Points by stage',
    dstat_style: 'Betting style',
    dstat_home: 'Home',
    dstat_draw: 'Draw',
    dstat_away: 'Away',

    // Champion picker
    cp_placeholder: 'Choose a team...',
    cp_search: '🔍  Search team...',

    // User modal
    um_title: 'Select player',
    um_or: 'or create your profile',
    um_placeholder: 'Your name',
    um_create: 'Create',
    um_loading: 'Loading...',
    um_no_players: 'No players yet.',

    // Toasts
    toast_expired: 'Your session expired. Select your profile again.',
    toast_connection: 'Connection error — check your internet',
    toast_select_profile: 'Select your profile first',
    toast_fill_scores: 'Fill in both scores',
    toast_bet_saved: 'Bet saved! ✓',
    toast_no_open: 'No open games without a bet',
    toast_champ_saved: 'Champion pick saved! 🏆',
    toast_scorer_saved: 'Top scorer pick saved! ⚽',
    toast_choose_team: 'Choose a team',
    toast_fill_player: 'Enter the player name',
    toast_clear_confirm: "Delete all your bets on games that haven't started yet?\n\nThis action cannot be undone.",
    toast_clear_result: 'Result removed ✓',

    // Bottom nav
    bnav_lb: 'Standings',
    bnav_bracket: 'Bracket',
    bnav_matches: 'Matches',
    bnav_me: 'Me',
    bnav_compare: 'Compare',

    // Next bet card
    next_bet_title: 'Next without a bet',
    next_bet_closes: 'closes in',
    next_bet_btn: 'Bet',

    // Player modal full compare
    pm_full_compare: 'Full comparison',

    // Compare tab
    tab_compare: '⚔️ Compare',
    cmp_title: 'Compare Players',
    cmp_sub: 'Pick two players to see their head-to-head matchup.',
    cmp_pick_player: 'Pick a player...',
    cmp_pick_both: 'Select two players to compare.',
    cmp_points: 'points',
    cmp_exact: 'Exact',
    cmp_results: 'Correct',
    cmp_champ: '🏆 Champion',
    cmp_scorer: '⚽ Top scorer',
    cmp_no_pick: '—',
    cmp_h2h_title: 'Head-to-head',
    cmp_h2h_games: 'games in common',
    cmp_h2h_win: 'W',
    cmp_h2h_draw: 'D',
    cmp_h2h_loss: 'L',
    cmp_matches_title: 'Match by match',
    cmp_no_finished: 'No finished matches yet.',
    cmp_pts_label: 'pts',
    cmp_tie: 'Tie',

    // Admin
    admin_title: 'Administration',
    admin_restricted: '🔐 Restricted access',
    admin_pwd_hint: 'Enter the admin password to continue.',
    admin_pwd_placeholder: 'Admin password',
    admin_enter: 'Enter',
  },
};

/* ─── i18n helpers ────────────────────────────────────────────────────────── */
let _lang = localStorage.getItem('bolao_lang') || 'pt';

function t(key, vars) {
  const dict = LANG_DATA[_lang] || LANG_DATA.pt;
  let str = dict[key] ?? LANG_DATA.pt[key] ?? key;
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    });
  }
  return str;
}

const _STAGE_KEYS = {
  'Fase de Grupos':    'stage_groups',
  '32 avos de Final':  'stage_32',
  'Oitavas de Final':  'stage_16',
  'Quartas de Final':  'stage_qf',
  'Semifinal':         'stage_sf',
  'Terceiro Lugar':    'stage_3rd',
  'Final':             'stage_final',
};

const _STAGE_SHORT_KEYS = {
  'Fase de Grupos':    'stage_short_groups',
  '32 avos de Final':  'stage_short_32',
  'Oitavas de Final':  'stage_short_16',
  'Quartas de Final':  'stage_short_qf',
  'Semifinal':         'stage_short_sf',
  'Terceiro Lugar':    'stage_short_3rd',
  'Final':             'stage_short_final',
};

function tStage(name)      { const k = _STAGE_KEYS[name];       return k ? t(k) : name; }
function tStageShort(name) { const k = _STAGE_SHORT_KEYS[name]; return k ? t(k) : name; }
function dateLocale()      { return t('date_locale'); }
function getCurrentLang()  { return _lang; }

function setCurrentLang(lang) {
  if (!LANG_DATA[lang]) return;
  _lang = lang;
  localStorage.setItem('bolao_lang', lang);
  _applyStaticTranslations();
}

function _applyStaticTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  // Keep lang-pill buttons in sync
  document.querySelectorAll('.lang-pill').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === _lang);
  });
}

// Apply on initial load once DOM is ready
document.addEventListener('DOMContentLoaded', _applyStaticTranslations);
