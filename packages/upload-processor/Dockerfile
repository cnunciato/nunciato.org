FROM ubuntu:latest

# Install various tools.
RUN apt-get update && \
	apt-get upgrade -y && \
	apt-get install -y \
	ffmpeg \
	curl \
	wget \
	exiftran \
	unzip \
	make \
	python3.12-venv \
    python-is-python3

# Install Node and NPM.
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs

# Install the AWS CLI.
RUN python -V
RUN wget https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip
RUN unzip awscli-exe-linux-x86_64.zip
RUN ./aws/install --bin-dir /usr/local/bin --install-dir /usr/local/aws-cli --update

# Create the app directory.
WORKDIR /usr/src/app

# Copy the app into the container.
COPY . ./

# Install and build.
RUN npm install
RUN npm run build

# And go!
EXPOSE 8080
CMD [ "npm", "start" ]
