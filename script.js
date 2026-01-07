const API_KEY = '8ef4d2d6dc38ef16d27e7eb969d6e921';
const BASE_URL = 'https://api.themoviedb.org/3';

// DOM 요소
const homePage = document.getElementById('homePage');
const searchPage = document.getElementById('searchPage');
const detailPage = document.getElementById('detailPage');
const favoritesPage = document.getElementById('favoritesPage');
const navBtns = document.querySelectorAll('.nav-btn');
const genresContainer = document.getElementById('genresContainer');
const homeLoading = document.getElementById('homeLoading');
const homeError = document.getElementById('homeError');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchResults = document.getElementById('searchResults');
const searchLoading = document.getElementById('searchLoading');
const searchError = document.getElementById('searchError');
const backBtn = document.getElementById('backBtn');
const movieDetail = document.getElementById('movieDetail');
const detailLoading = document.getElementById('detailLoading');
const detailError = document.getElementById('detailError');
const favoritesContainer = document.getElementById('favoritesContainer');
const favoritesLoading = document.getElementById('favoritesLoading');
const emptyFavorites = document.getElementById('emptyFavorites');

// 이전 페이지 추적
let previousPage = 'home';

// localStorage 키
const FAVORITES_KEY = 'noona_movies_favorites';

// 찜 목록 관리 함수들
function getFavorites() {
    const favorites = localStorage.getItem(FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
}

function saveFavorites(favorites) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

function addToFavorites(movie) {
    const favorites = getFavorites();
    if (!favorites.find(f => f.id === movie.id)) {
        favorites.push({
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            release_date: movie.release_date
        });
        saveFavorites(favorites);
        return true;
    }
    return false;
}

function removeFromFavorites(movieId) {
    const favorites = getFavorites();
    const filtered = favorites.filter(f => f.id !== movieId);
    saveFavorites(filtered);
    return filtered.length !== favorites.length;
}

function isFavorite(movieId) {
    const favorites = getFavorites();
    return favorites.some(f => f.id === movieId);
}

// 페이지 전환
function showPage(pageName) {
    // 현재 활성 페이지 저장 (상세 페이지로 가는 경우)
    if (pageName === 'detail') {
        if (homePage.classList.contains('active')) {
            previousPage = 'home';
        } else if (searchPage.classList.contains('active')) {
            previousPage = 'search';
        } else if (favoritesPage.classList.contains('active')) {
            previousPage = 'favorites';
        }
    }
    
    // 모든 페이지 숨기기
    homePage.classList.remove('active');
    searchPage.classList.remove('active');
    detailPage.classList.remove('active');
    favoritesPage.classList.remove('active');
    
    // 네비게이션 버튼 업데이트
    navBtns.forEach(b => b.classList.remove('active'));
    
    // 선택한 페이지 표시
    if (pageName === 'home') {
        homePage.classList.add('active');
        navBtns[0].classList.add('active');
    } else if (pageName === 'search') {
        searchPage.classList.add('active');
        navBtns[1].classList.add('active');
    } else if (pageName === 'favorites') {
        favoritesPage.classList.add('active');
        navBtns[2].classList.add('active');
        loadFavoritesPage();
    } else if (pageName === 'detail') {
        detailPage.classList.add('active');
    }
}

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        showPage(page);
    });
});

// 뒤로가기 버튼
backBtn.addEventListener('click', () => {
    showPage(previousPage);
});

// 장르 목록 가져오기
async function fetchGenres() {
    try {
        const response = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=ko-KR`);
        if (!response.ok) throw new Error('장르 목록을 가져올 수 없습니다.');
        const data = await response.json();
        return data.genres;
    } catch (error) {
        console.error('장르 목록 오류:', error);
        return [];
    }
}

// 장르별 영화 가져오기
async function fetchMoviesByGenre(genreId, genreName) {
    try {
        const response = await fetch(
            `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=ko-KR&with_genres=${genreId}&sort_by=popularity.desc&page=1`
        );
        if (!response.ok) throw new Error('영화 데이터를 가져올 수 없습니다.');
        const data = await response.json();
        return { genreName, movies: data.results.slice(0, 20) }; // 최대 20개
    } catch (error) {
        console.error('영화 데이터 오류:', error);
        return { genreName, movies: [] };
    }
}

// 홈페이지 초기화
async function initHomePage() {
    try {
        homeLoading.style.display = 'block';
        homeError.style.display = 'none';
        genresContainer.innerHTML = '';
        
        const genres = await fetchGenres();
        
        if (genres.length === 0) {
            throw new Error('장르를 불러올 수 없습니다.');
        }
        
        // 주요 장르만 선택 (액션, 코미디, 드라마, 공포, 로맨스, SF, 스릴러)
        const mainGenres = genres.filter(g => 
            [28, 35, 18, 27, 10749, 878, 53].includes(g.id)
        );
        
        // 각 장르별 영화 가져오기
        const genrePromises = mainGenres.map(genre => 
            fetchMoviesByGenre(genre.id, genre.name)
        );
        
        const genreData = await Promise.all(genrePromises);
        
        // 장르별 카로셀 생성
        genreData.forEach(({ genreName, movies }) => {
            if (movies.length > 0) {
                createGenreCarousel(genreName, movies);
            }
        });
        
        homeLoading.style.display = 'none';
        
    } catch (error) {
        console.error('홈페이지 초기화 오류:', error);
        homeLoading.style.display = 'none';
        homeError.style.display = 'block';
    }
}

// 장르별 카로셀 생성
function createGenreCarousel(genreName, movies) {
    const genreSection = document.createElement('div');
    genreSection.className = 'genre-section';
    
    const genreTitle = document.createElement('h3');
    genreTitle.className = 'genre-title';
    genreTitle.textContent = genreName;
    
    const carouselContainer = document.createElement('div');
    carouselContainer.className = 'carousel-container';
    
    const prevBtn = document.createElement('button');
    prevBtn.className = 'carousel-btn prev';
    prevBtn.innerHTML = '‹';
    prevBtn.onclick = () => scrollCarousel(carouselWrapper, -400);
    
    const nextBtn = document.createElement('button');
    nextBtn.className = 'carousel-btn next';
    nextBtn.innerHTML = '›';
    nextBtn.onclick = () => scrollCarousel(carouselWrapper, 400);
    
    const carouselWrapper = document.createElement('div');
    carouselWrapper.className = 'carousel-wrapper';
    
    const carouselMovies = document.createElement('div');
    carouselMovies.className = 'carousel-movies';
    
    movies.forEach(movie => {
        const movieCard = createMovieCard(movie, true);
        carouselMovies.appendChild(movieCard);
    });
    
    carouselWrapper.appendChild(carouselMovies);
    carouselContainer.appendChild(prevBtn);
    carouselContainer.appendChild(nextBtn);
    carouselContainer.appendChild(carouselWrapper);
    
    genreSection.appendChild(genreTitle);
    genreSection.appendChild(carouselContainer);
    genresContainer.appendChild(genreSection);
}

// 카로셀 스크롤
function scrollCarousel(element, offset) {
    element.scrollBy({
        left: offset,
        behavior: 'smooth'
    });
}

// 영화 카드 생성
function createMovieCard(movie, isCarousel = false) {
    const card = document.createElement('div');
    card.className = isCarousel ? 'carousel-movie-card' : 'movie-card';
    
    const posterPath = movie.poster_path 
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : 'https://via.placeholder.com/500x750?text=No+Image';
    
    const releaseDate = movie.release_date 
        ? new Date(movie.release_date).getFullYear()
        : '날짜 없음';
    
    card.innerHTML = `
        <img 
            src="${posterPath}" 
            alt="${movie.title}" 
            class="${isCarousel ? 'carousel-poster' : 'movie-poster'}"
            loading="lazy"
            onerror="this.src='https://via.placeholder.com/500x750?text=No+Image'"
        >
        <div class="movie-info">
            <h3 class="movie-title">${movie.title}</h3>
            <p class="movie-release-date">${releaseDate}</p>
        </div>
    `;
    
    // 클릭 이벤트 추가
    card.addEventListener('click', () => {
        showMovieDetail(movie.id);
    });
    
    return card;
}

// 영화 상세 정보 가져오기
async function fetchMovieDetail(movieId) {
    try {
        detailLoading.style.display = 'block';
        detailError.style.display = 'none';
        movieDetail.style.display = 'none';
        
        const response = await fetch(
            `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=ko-KR`
        );
        
        if (!response.ok) {
            throw new Error('영화 상세 정보를 가져올 수 없습니다.');
        }
        
        const data = await response.json();
        displayMovieDetail(data);
        
    } catch (error) {
        console.error('영화 상세 정보 오류:', error);
        detailLoading.style.display = 'none';
        detailError.style.display = 'block';
    }
}

// 영화 상세 정보 표시
function displayMovieDetail(movie) {
    detailLoading.style.display = 'none';
    movieDetail.style.display = 'block';
    
    const posterPath = movie.poster_path 
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : 'https://via.placeholder.com/500x750?text=No+Image';
    
    const releaseDate = movie.release_date 
        ? new Date(movie.release_date).toLocaleDateString('ko-KR')
        : '날짜 없음';
    
    const runtime = movie.runtime ? `${movie.runtime}분` : '정보 없음';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '0.0';
    
    const genres = movie.genres && movie.genres.length > 0
        ? movie.genres.map(g => `<span class="movie-detail-genre">${g.name}</span>`).join('')
        : '<span class="movie-detail-genre">장르 정보 없음</span>';
    
    const productionCompanies = movie.production_companies && movie.production_companies.length > 0
        ? movie.production_companies.map(c => c.name).join(', ')
        : '정보 없음';
    
    const productionCountries = movie.production_countries && movie.production_countries.length > 0
        ? movie.production_countries.map(c => c.name).join(', ')
        : '정보 없음';
    
    const favorite = isFavorite(movie.id);
    const favoriteBtnText = favorite ? '❤️ 찜 해제' : '🤍 찜하기';
    const favoriteBtnClass = favorite ? 'favorite-btn active' : 'favorite-btn';
    
    movieDetail.innerHTML = `
        <div class="movie-detail-container">
            <img 
                src="${posterPath}" 
                alt="${movie.title}" 
                class="movie-detail-poster"
                onerror="this.src='https://via.placeholder.com/500x750?text=No+Image'"
            >
            <div class="movie-detail-info">
                <h2 class="movie-detail-title">${movie.title}</h2>
                ${movie.tagline ? `<p class="movie-detail-tagline">"${movie.tagline}"</p>` : ''}
                
                <button class="${favoriteBtnClass}" id="favoriteBtn" data-movie-id="${movie.id}">
                    ${favoriteBtnText}
                </button>
                
                <div class="movie-detail-meta">
                    <div class="movie-detail-meta-item">
                        <span class="movie-detail-meta-label">개봉일:</span>
                        <span>${releaseDate}</span>
                    </div>
                    <div class="movie-detail-meta-item">
                        <span class="movie-detail-meta-label">상영시간:</span>
                        <span>${runtime}</span>
                    </div>
                    <div class="movie-detail-rating">
                        <span>⭐</span>
                        <span>${rating}</span>
                    </div>
                </div>
                
                <div class="movie-detail-genres">
                    ${genres}
                </div>
                
                ${movie.overview ? `
                    <div class="movie-detail-overview">
                        <h3 class="movie-detail-overview-title">줄거리</h3>
                        <p>${movie.overview}</p>
                    </div>
                ` : ''}
                
                <div class="movie-detail-production">
                    <h3 class="movie-detail-production-title">제작 정보</h3>
                    <p class="movie-detail-production-item"><strong>제작사:</strong> ${productionCompanies}</p>
                    <p class="movie-detail-production-item"><strong>제작 국가:</strong> ${productionCountries}</p>
                </div>
            </div>
        </div>
    `;
    
    // 찜 버튼 이벤트 추가
    const favoriteBtn = document.getElementById('favoriteBtn');
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(movie);
        });
    }
}

// 찜 토글 함수
function toggleFavorite(movie) {
    const favorite = isFavorite(movie.id);
    const favoriteBtn = document.getElementById('favoriteBtn');
    
    if (favorite) {
        removeFromFavorites(movie.id);
        if (favoriteBtn) {
            favoriteBtn.textContent = '🤍 찜하기';
            favoriteBtn.classList.remove('active');
        }
    } else {
        addToFavorites(movie);
        if (favoriteBtn) {
            favoriteBtn.textContent = '❤️ 찜 해제';
            favoriteBtn.classList.add('active');
        }
    }
    
    // 찜 페이지가 활성화되어 있으면 다시 로드
    if (favoritesPage.classList.contains('active')) {
        loadFavoritesPage();
    }
}

// 찜 페이지 로드
function loadFavoritesPage() {
    favoritesLoading.style.display = 'block';
    emptyFavorites.style.display = 'none';
    favoritesContainer.innerHTML = '';
    
    const favorites = getFavorites();
    
    if (favorites.length === 0) {
        favoritesLoading.style.display = 'none';
        emptyFavorites.style.display = 'block';
        return;
    }
    
    // 찜한 영화들을 표시
    favorites.forEach(favorite => {
        const movieCard = createMovieCard(favorite, false);
        favoritesContainer.appendChild(movieCard);
    });
    
    favoritesLoading.style.display = 'none';
}

// 영화 상세 페이지 표시
function showMovieDetail(movieId) {
    showPage('detail');
    fetchMovieDetail(movieId);
}

// 영화 검색
async function searchMovies(query) {
    if (!query.trim()) {
        searchResults.innerHTML = '<p style="text-align: center; color: white; grid-column: 1 / -1;">검색어를 입력해주세요.</p>';
        return;
    }
    
    try {
        searchLoading.style.display = 'block';
        searchError.style.display = 'none';
        searchResults.innerHTML = '';
        
        const response = await fetch(
            `${BASE_URL}/search/movie?api_key=${API_KEY}&language=ko-KR&query=${encodeURIComponent(query)}&page=1`
        );
        
        if (!response.ok) {
            throw new Error('검색 요청 실패');
        }
        
        const data = await response.json();
        
        if (data.results.length === 0) {
            searchResults.innerHTML = '<p style="text-align: center; color: white; grid-column: 1 / -1; padding: 40px;">검색 결과가 없습니다.</p>';
        } else {
            data.results.forEach(movie => {
                const movieCard = createMovieCard(movie, false);
                searchResults.appendChild(movieCard);
            });
        }
        
        searchLoading.style.display = 'none';
        
    } catch (error) {
        console.error('검색 오류:', error);
        searchLoading.style.display = 'none';
        searchError.style.display = 'block';
    }
}

// 검색 이벤트
searchBtn.addEventListener('click', () => {
    searchMovies(searchInput.value);
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchMovies(searchInput.value);
    }
});

// 페이지 로드 시 홈페이지 초기화
initHomePage();
