# CryptoNoteWallet CMake Configuration
# This file provides CMake configuration for the CryptoNote wallet library

# Set CryptoNote source directories
set(CRYPTONOTE_SOURCE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/cryptonote/src)
set(CRYPTONOTE_INCLUDE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/cryptonote/include)

# Add CryptoNote include directories
include_directories(${CRYPTONOTE_INCLUDE_DIR})
include_directories(${CRYPTONOTE_SOURCE_DIR})

# Set CMake policy to suppress Boost warning
cmake_policy(SET CMP0167 NEW)

# Find required libraries
# Handle different Boost versions and CMake configurations
set(Boost_NO_BOOST_CMAKE ON)
set(Boost_USE_STATIC_LIBS OFF)
set(Boost_USE_MULTITHREADED ON)
set(Boost_USE_STATIC_RUNTIME OFF)
find_package(Boost REQUIRED COMPONENTS system filesystem thread)

# CryptoNote library is already created in main CMakeLists.txt
# This file only provides Boost configuration and include directories