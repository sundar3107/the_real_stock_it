pipeline {
    agent any

    options {
        timeout(time: 15, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
    }

    environment {
        CI = 'true'
        NODE_ENV = 'test'
    }

    stages {
        stage('SCM Checkout') {
            steps {
                echo '=== Stage 1: Checking out source code from SCM repository ==='
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '=== Stage 2: Installing Backend and Frontend dependencies ==='
                dir('backend') {
                    script {
                        if (isUnix()) {
                            sh 'npm install'
                        } else {
                            bat 'npm install'
                        }
                    }
                }
                dir('frontend') {
                    script {
                        if (isUnix()) {
                            sh 'npm install'
                        } else {
                            bat 'npm install'
                        }
                    }
                }
            }
        }

        stage('Automated Tests & Quality Gate') {
            steps {
                echo '=== Stage 3: Running Automated Verification Tests (Modules 1-4) ==='
                dir('backend') {
                    script {
                        // Runs 48 automated test scenarios
                        if (isUnix()) {
                            sh 'npm test'
                        } else {
                            bat 'npm test'
                        }
                    }
                }
            }
        }

        stage('Build & Compilation') {
            steps {
                echo '=== Stage 4: Compiling Backend (tsc) and Frontend (Vite) ==='
                dir('backend') {
                    script {
                        if (isUnix()) {
                            sh 'npm run build'
                        } else {
                            bat 'npm run build'
                        }
                    }
                }
                dir('frontend') {
                    script {
                        if (isUnix()) {
                            sh 'npm run build'
                        } else {
                            bat 'npm run build'
                        }
                    }
                }
            }
        }

        stage('Archive Artifacts') {
            steps {
                echo '=== Stage 5: Archiving Production Build Artifacts ==='
                archiveArtifacts artifacts: 'backend/dist/**, frontend/dist/**', fingerprint: true, allowEmptyArchive: false
            }
        }
    }

    post {
        success {
            echo '====================================================='
            echo ' Jenkins CI Pipeline PASSED: All 48 tests verified!  '
            echo ' SCM Release baseline ready for deployment.          '
            echo '====================================================='
        }
        failure {
            echo '====================================================='
            echo ' Jenkins CI Pipeline FAILED: Review logs for details.'
            echo '====================================================='
        }
    }
}
