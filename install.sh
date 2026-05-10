/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" && \
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile && \
eval "$(/opt/homebrew/bin/brew shellenv)" && \
brew install git nvm && \
mkdir -p ~/.nvm && \
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc && \
echo 'source $(brew --prefix nvm)/nvm.sh' >> ~/.zshrc && \
source ~/.zshrc && \
nvm install node && \
git --version && \
node -v && \
npm -v