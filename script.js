const API_KEY = '8ef4d2d6dc38ef16d27e7eb969d6e921';
const BASE_URL = 'https://api.themoviedb.org/3';

// DOM 요소
const homePage = document.getElementById('homePage');
const searchPage = document.getElementById('searchPage');
const navBtns = document.querySelectorAll('.nav-btn');
const genresContainer = document.getElementById('genresContainer');
const homeLoading = document.getElementById('homeLoading');
const homeError = document.getElementById('homeError');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchResults = document.getElementById('searchResults');
const searchLoading = document.getElementById('searchLoading');
const searchError = document.getElementById('searchError');

// 페이지 전환
navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        
        // 네비게이션 버튼 활성화
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // 페이지 전환
        if (page === 'home') {
            homePage.classList.add('active');
            searchPage.classList.remove('active');
        } else {
            homePage.classList.remove('active');
            searchPage.classList.add('active');
        }
    });
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
    
    return card;
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
