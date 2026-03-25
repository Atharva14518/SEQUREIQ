.PHONY: install backend frontend run stop

install:
	@echo "📦 Installing backend dependencies..."
	cd backend && pip install -r requirements.txt
	@echo "📦 Installing frontend dependencies..."
	cd frontend && npm install
	@echo "✅ All dependencies installed!"

backend:
	@echo "🚀 Starting FastAPI backend on port 8000..."
	cd backend && uvicorn main:app --reload --port 8000

frontend:
	@echo "🌐 Starting Vite frontend on port 5173..."
	cd frontend && npm run dev

run:
	@echo "🚀 Starting SecureIQ (both servers)..."
	@(cd backend && uvicorn main:app --reload --port 8000) & \
	(cd frontend && npm run dev) & \
	wait

stop:
	@pkill -f "uvicorn main:app" 2>/dev/null || true
	@pkill -f "vite" 2>/dev/null || true
	@echo "🛑 Servers stopped."

check-ollama:
	@curl -s http://localhost:11434/api/tags > /dev/null && echo "✅ Ollama is running" || echo "❌ Ollama is NOT running. Run: ollama serve"

check-backend:
	@curl -s http://localhost:8000/health && echo "" || echo "❌ Backend not running. Run: make backend"
