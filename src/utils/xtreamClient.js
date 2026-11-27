/**
 * Xtream Codes API Client for Live TV, Movies (VOD), Series & Short EPG
 */

export function normalizeServerUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = 'http://' + url;
  }
  return url.replace(/\/+$/, '');
}

export function buildXtreamApiUrl(serverUrl, username, password, action, extraParams = {}) {
  const base = normalizeServerUrl(serverUrl);
  const params = [
    'username=' + encodeURIComponent(username.trim()),
    'password=' + encodeURIComponent(password.trim()),
  ];
  if (action) {
    params.push('action=' + encodeURIComponent(action));
  }
  const keys = Object.keys(extraParams);
  for (let i = 0; i < keys.length; i += 1) {
    const k = keys[i];
    if (extraParams[k] !== undefined && extraParams[k] !== null) {
      params.push(encodeURIComponent(k) + '=' + encodeURIComponent(String(extraParams[k])));
    }
  }
  return base + '/player_api.php?' + params.join('&');
}

export function buildXtreamStreamUrl(serverUrl, username, password, type, streamId, ext, convertTsToM3u8 = true) {
  const base = normalizeServerUrl(serverUrl);
  const user = encodeURIComponent(username.trim());
  const pass = encodeURIComponent(password.trim());
  if (type === 'live') {
    const format = convertTsToM3u8 ? 'm3u8' : (ext || 'ts');
    return base + '/live/' + user + '/' + pass + '/' + streamId + '.' + format;
  }
  if (type === 'movies') {
    return base + '/movie/' + user + '/' + pass + '/' + streamId + '.' + (ext || 'mp4');
  }
  return base + '/series/' + user + '/' + pass + '/' + streamId + '.' + (ext || 'mp4');
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('HTTP ' + res.status + ' from Xtream server');
  }
  return res.json();
}

export async function authenticateXtream(serverUrl, username, password) {
  const url = buildXtreamApiUrl(serverUrl, username, password, '');
  const data = await fetchJson(url);
  if (!data || !data.user_info || data.user_info.auth === 0) {
    throw new Error('Invalid Xtream Codes credentials or server response');
  }
  return data;
}

function buildCategoryMap(categories) {
  const map = {};
  if (Array.isArray(categories)) {
    for (let i = 0; i < categories.length; i += 1) {
      const c = categories[i];
      if (c && c.category_id !== undefined) {
        map[String(c.category_id)] = c.category_name || 'General';
      }
    }
  }
  return map;
}

export async function fetchXtreamCatalog(creds, options = {}) {
  const { convertTs = true } = options;
  const { serverUrl, username, password } = creds;

  const authData = await authenticateXtream(serverUrl, username, password);

  const [
    liveCats,
    liveStreams,
    vodCats,
    vodStreams,
    seriesCats,
    seriesList,
  ] = await Promise.all([
    fetchJson(buildXtreamApiUrl(serverUrl, username, password, 'get_live_categories')).catch(() => []),
    fetchJson(buildXtreamApiUrl(serverUrl, username, password, 'get_live_streams')).catch(() => []),
    fetchJson(buildXtreamApiUrl(serverUrl, username, password, 'get_vod_categories')).catch(() => []),
    fetchJson(buildXtreamApiUrl(serverUrl, username, password, 'get_vod_streams')).catch(() => []),
    fetchJson(buildXtreamApiUrl(serverUrl, username, password, 'get_series_categories')).catch(() => []),
    fetchJson(buildXtreamApiUrl(serverUrl, username, password, 'get_series')).catch(() => []),
  ]);

  const liveCatMap = buildCategoryMap(liveCats);
  const vodCatMap = buildCategoryMap(vodCats);
  const seriesCatMap = buildCategoryMap(seriesCats);

  const live = Array.isArray(liveStreams)
    ? liveStreams.map(function (s, idx) {
        return {
          id: 'xt_live_' + s.stream_id,
          streamId: s.stream_id,
          type: 'live',
          title: s.name || 'Live Channel',
          group: liveCatMap[String(s.category_id)] || 'Live TV',
          logo: s.stream_icon || '',
          epgChannelId: s.epg_channel_id || '',
          addedAt: Number(s.added) || Number(s.stream_id) || 0,
          orderIndex: idx,
          url: buildXtreamStreamUrl(serverUrl, username, password, 'live', s.stream_id, 'ts', convertTs),
          rawUrl: buildXtreamStreamUrl(serverUrl, username, password, 'live', s.stream_id, 'ts', false),
          source: 'xtream',
        };
      })
    : [];

  const movies = Array.isArray(vodStreams)
    ? vodStreams.map(function (m, idx) {
        const ext = m.container_extension || 'mp4';
        return {
          id: 'xt_movie_' + m.stream_id,
          streamId: m.stream_id,
          type: 'movies',
          title: m.name || 'Movie',
          group: vodCatMap[String(m.category_id)] || 'Movies',
          logo: m.stream_icon || '',
          rating: m.rating || '',
          addedAt: Number(m.added) || Number(m.stream_id) || 0,
          orderIndex: idx,
          url: buildXtreamStreamUrl(serverUrl, username, password, 'movies', m.stream_id, ext, convertTs),
          rawUrl: buildXtreamStreamUrl(serverUrl, username, password, 'movies', m.stream_id, ext, false),
          source: 'xtream',
        };
      })
    : [];

  const series = Array.isArray(seriesList)
    ? seriesList.map(function (sr, idx) {
        return {
          id: 'xt_series_' + sr.series_id,
          seriesId: sr.series_id,
          type: 'series',
          title: sr.name || 'Series',
          group: seriesCatMap[String(sr.category_id)] || 'Series',
          logo: sr.cover || '',
          plot: sr.plot || '',
          rating: sr.rating || '',
          addedAt: Number(sr.last_modified) || Number(sr.series_id) || 0,
          orderIndex: idx,
          source: 'xtream',
          isSeriesContainer: true,
        };
      })
    : [];

  return {
    authData,
    items: live.concat(movies, series),
    live,
    movies,
    series,
    groups: {
      live: Object.keys(liveCatMap).map((k) => liveCatMap[k]),
      movies: Object.keys(vodCatMap).map((k) => vodCatMap[k]),
      series: Object.keys(seriesCatMap).map((k) => seriesCatMap[k]),
    },
  };
}

export async function fetchXtreamSeriesEpisodes(creds, seriesId) {
  const { serverUrl, username, password } = creds;
  const url = buildXtreamApiUrl(serverUrl, username, password, 'get_series_info', {
    series_id: seriesId,
  });
  const data = await fetchJson(url);
  const episodesBySeason = {};
  const episodesObj = (data && data.episodes) || {};
  const seasonKeys = Object.keys(episodesObj);

  for (let i = 0; i < seasonKeys.length; i += 1) {
    const season = seasonKeys[i];
    const list = Array.isArray(episodesObj[season]) ? episodesObj[season] : [];
    episodesBySeason[season] = list.map(function (ep) {
      const ext = ep.container_extension || 'mp4';
      return {
        id: 'xt_ep_' + ep.id,
        episodeId: ep.id,
        season: Number(season) || 1,
        episode: Number(ep.episode_num) || 1,
        title: ep.title || ('S' + season + 'E' + ep.episode_num),
        duration: ep.info && ep.info.duration ? ep.info.duration : '',
        url: buildXtreamStreamUrl(serverUrl, username, password, 'series', ep.id, ext, false),
        type: 'series',
        source: 'xtream',
      };
    });
  }

  return {
    info: (data && data.info) || {},
    episodesBySeason,
  };
}

function decodeBase64Safe(str) {
  if (!str) return '';
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch (e) {
    try {
      return atob(str);
    } catch (e2) {
      return str;
    }
  }
}

export async function fetchXtreamShortEpg(creds, streamId, limit = 2) {
  if (!creds || !creds.serverUrl || !streamId) return [];
  const url = buildXtreamApiUrl(creds.serverUrl, creds.username, creds.password, 'get_short_epg', {
    stream_id: streamId,
    limit,
  });
  try {
    const data = await fetchJson(url);
    const listings = (data && data.epg_listings) || [];
    return listings.map(function (ep) {
      return {
        id: ep.id || '',
        title: decodeBase64Safe(ep.title),
        description: decodeBase64Safe(ep.description),
        start: ep.start || '',
        end: ep.end || '',
        startTimestamp: ep.start_timestamp ? Number(ep.start_timestamp) * 1000 : 0,
        stopTimestamp: ep.stop_timestamp ? Number(ep.stop_timestamp) * 1000 : 0,
      };
    });
  } catch (e) {
    return [];
  }
}
