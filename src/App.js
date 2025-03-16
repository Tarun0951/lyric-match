import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  // State variables
  const [gameActive, setGameActive] = useState(false);
  const [lyricSnippet, setLyricSnippet] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [genreFilter, setGenreFilter] = useState([]);
  const [availableGenres, setAvailableGenres] = useState([]);
  const [userGuess, setUserGuess] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctSong, setCorrectSong] = useState('');
  const [hintsAvailable, setHintsAvailable] = useState(0);
  const [currentHint, setCurrentHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // API base URL - change this to your actual API URL
  const API_URL = 'https://lyric-match-api.onrender.com/api';

  // Fetch available genres when component mounts
  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      const response = await fetch(`${API_URL}/genres`);
      const data = await response.json();
      setAvailableGenres(data);
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  const startGame = async () => {
    setLoading(true);
    setFeedback('');
    setIsCorrect(false);
    setCorrectSong('');
    setCurrentHint('');
    setUserGuess('');
    setGameOver(false);
    
    try {
      const response = await fetch(`${API_URL}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          difficulty,
          genre_filter: genreFilter.length > 0 ? genreFilter : null,
        }),
      });
      
      const data = await response.json();
      setLyricSnippet(data.lyric_snippet);
      setSessionId(data.session_id);
      setHintsAvailable(data.hints_available);
      setGameActive(true);
    } catch (error) {
      console.error('Error starting game:', error);
      setFeedback('Failed to start game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitGuess = async () => {
    if (!userGuess.trim()) {
      setFeedback('Please enter a guess');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/guess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_guess: userGuess,
          session_id: sessionId,
        }),
      });
      
      const data = await response.json();
      setFeedback(data.feedback);
      setIsCorrect(data.is_correct);
      
      if (data.correct_song) {
        setCorrectSong(data.correct_song);
        setGameOver(true);
        // Don't set gameActive to false here - we still want to show the game panel
      }
    } catch (error) {
      console.error('Error submitting guess:', error);
      setFeedback('Failed to submit guess. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getHint = async (hintType) => {
    if (hintsAvailable <= 0) {
      setCurrentHint('No hints available');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/hint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          hint_type: hintType,
        }),
      });
      
      const data = await response.json();
      setCurrentHint(data.hint);
      setHintsAvailable(data.hints_remaining);
    } catch (error) {
      console.error('Error getting hint:', error);
      setCurrentHint('Failed to get hint. You may have already used this hint type.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenreChange = (genreId) => {
    if (genreFilter.includes(genreId)) {
      setGenreFilter(genreFilter.filter(g => g !== genreId));
    } else {
      setGenreFilter([...genreFilter, genreId]);
    }
  };

  const cancelGame = async () => {
    if (sessionId && !gameOver) {
      try {
        await fetch(`${API_URL}/session/${sessionId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Error canceling game:', error);
      }
    }
    
    setGameActive(false);
    setLyricSnippet('');
    setSessionId('');
    setFeedback('');
    setIsCorrect(false);
    setCorrectSong('');
    setCurrentHint('');
    setUserGuess('');
    setGameOver(false);
  };

  const startNewGame = () => {
    setGameActive(false);
    setGameOver(false);
    // We'll let them configure settings again before starting a new game
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎵 Lyric Match Game 🎵</h1>
        <p>Guess the song from lyrics!</p>
      </header>

      <main>
        {!gameActive ? (
          <div className="start-panel">
            <h2>Start a New Game</h2>
            
            <div className="form-group">
              <label>
                Difficulty:
                <select 
                  value={difficulty} 
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>
            </div>
            
            <div className="form-group">
              <label>Genre Filters (Optional):</label>
              <div className="genres-list">
                {availableGenres.map((genre) => (
                  <label key={genre.id} className="genre-checkbox">
                    <input
                      type="checkbox"
                      checked={genreFilter.includes(genre.id)}
                      onChange={() => handleGenreChange(genre.id)}
                    />
                    {genre.name}
                  </label>
                ))}
              </div>
            </div>
            
            <button 
              className="primary-button" 
              onClick={startGame} 
              disabled={loading}
            >
              {loading ? 'Starting...' : 'Start Game'}
            </button>
          </div>
        ) : (
          <div className="game-panel">
            <div className="lyrics-box">
              <h2>Lyrics:</h2>
              <blockquote>
                {lyricSnippet.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </blockquote>
            </div>
            
            {!gameOver ? (
              <div className="guess-box">
                <input
                  type="text"
                  placeholder="Enter song and artist..."
                  value={userGuess}
                  onChange={(e) => setUserGuess(e.target.value)}
                  disabled={loading}
                />
                <button 
                  className="primary-button" 
                  onClick={submitGuess}
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Guess'}
                </button>
              </div>
            ) : (
              <div className="game-over-panel">
                <h3>Game Over!</h3>
                <div className="correct-answer">
                  <p>The correct answer was:</p>
                  <h2>{correctSong}</h2>
                </div>
                <button 
                  className="primary-button" 
                  onClick={startNewGame}
                >
                  Play Again
                </button>
              </div>
            )}
            
            {feedback && (
              <div className={`feedback ${isCorrect ? 'correct' : ''}`}>
                {feedback}
              </div>
            )}
            
            {!gameOver && (
              <div className="hints-panel">
                <h3>Need a Hint? ({hintsAvailable} remaining)</h3>
                <div className="hint-buttons">
                  <button onClick={() => getHint('artist')} disabled={hintsAvailable <= 0 || loading}>
                    Artist
                  </button>
                  <button onClick={() => getHint('year')} disabled={hintsAvailable <= 0 || loading}>
                    Year
                  </button>
                  <button onClick={() => getHint('genre')} disabled={hintsAvailable <= 0 || loading}>
                    Genre
                  </button>
                  <button onClick={() => getHint('first_letter')} disabled={hintsAvailable <= 0 || loading}>
                    First Letter
                  </button>
                  <button onClick={() => getHint('word_count')} disabled={hintsAvailable <= 0 || loading}>
                    Word Count
                  </button>
                </div>
                
                {currentHint && (
                  <div className="hint-box">
                    <p><strong>Hint:</strong> {currentHint}</p>
                  </div>
                )}
              </div>
            )}
            
            {!gameOver && (
              <div className="controls">
                <button className="secondary-button" onClick={cancelGame}>
                  Cancel Game
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      
      <footer>
        <p>Created by Your Name • Powered by Lyric Match API</p>
      </footer>
    </div>
  );
}

export default App;
