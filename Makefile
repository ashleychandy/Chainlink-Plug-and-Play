# Chainlink Plug-and-Play Makefile

# Colors
CYAN := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
END := \033[0m

.PHONY: help deploy deploy-functions deploy-automation deploy-all

help:
	@echo "$(CYAN)Chainlink Plug-and-Play Deployment Tasks$(END)"
	@echo "-------------------------------------"
	@echo "$(GREEN)Available commands:$(END)"
	@echo "  make deploy              : Deploy the contract only"
	@echo "  make deploy-functions    : Deploy contract and add Chainlink Functions"
	@echo "  make deploy-automation   : Deploy contract and add Chainlink Automation"
	@echo "  make deploy-all          : Deploy contract with both Functions and Automation"
	@echo ""
	@echo "$(YELLOW)Before deploying:$(END)"
	@echo "1. Copy deploy/config/.env.example to .env"
	@echo "2. Update SCRIPT_PATH in .env to point to your deploy script"
	@echo "3. Fill in all required configuration values in .env"
	@echo "4. Make sure your deploy script exists at the specified path"

# Basic contract deployment
deploy:
	@echo "$(CYAN)Deploying contract...$(END)"
	node deploy/deploy.js

# Functions deployment
deploy-functions:
	@echo "$(CYAN)Deploying contract with Chainlink Functions...$(END)"
	node deploy/deploy.js --functions

# Automation deployment
deploy-automation:
	@echo "$(CYAN)Deploying contract with Chainlink Automation...$(END)"
	node deploy/deploy.js --automation

# Deploy with both Functions and Automation
deploy-all:
	@echo "$(CYAN)Deploying contract with both Chainlink Functions and Automation...$(END)"
	node deploy/deploy.js --functions --automation