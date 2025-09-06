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

# CryptoNote source files
set(CRYPTONOTE_SOURCES
    ${CRYPTONOTE_SOURCE_DIR}/crypto/crypto.cpp
    ${CRYPTONOTE_SOURCE_DIR}/crypto/hash.cpp
    ${CRYPTONOTE_SOURCE_DIR}/crypto/chacha8.c
    ${CRYPTONOTE_SOURCE_DIR}/crypto/keccak.c
    ${CRYPTONOTE_SOURCE_DIR}/crypto/slow-hash.c
    ${CRYPTONOTE_SOURCE_DIR}/crypto/slow-hash.cpp
    ${CRYPTONOTE_SOURCE_DIR}/crypto/tree-hash.c
    ${CRYPTONOTE_SOURCE_DIR}/crypto/random.c
    ${CRYPTONOTE_SOURCE_DIR}/crypto/groestl.c
    ${CRYPTONOTE_SOURCE_DIR}/crypto/blake256.c
    ${CRYPTONOTE_SOURCE_DIR}/crypto/jh.c
    ${CRYPTONOTE_SOURCE_DIR}/crypto/skein.c
    ${CRYPTONOTE_SOURCE_DIR}/crypto/aesb.c
    ${CRYPTONOTE_SOURCE_DIR}/crypto/oaes_lib.c
    ${CRYPTONOTE_SOURCE_DIR}/crypto/crypto-ops.c
    ${CRYPTONOTE_SOURCE_DIR}/crypto/crypto-ops-data.c
    ${CRYPTONOTE_SOURCE_DIR}/crypto/hash-extra-blake.c
    ${CRYPTONOTE_SOURCE_DIR}/crypto/hash-extra-groestl.c
    ${CRYPTONOTE_SOURCE_DIR}/crypto/hash-extra-jh.c
    ${CRYPTONOTE_SOURCE_DIR}/crypto/hash-extra-skein.c
)

# Create CryptoNote library
add_library(cryptonote STATIC ${CRYPTONOTE_SOURCES})

# Link libraries
target_link_libraries(cryptonote ${Boost_LIBRARIES})

# Set compile definitions
target_compile_definitions(cryptonote PRIVATE
    CRYPTONOTE_VERSION_MAJOR=1
    CRYPTONOTE_VERSION_MINOR=0
    CRYPTONOTE_VERSION_PATCH=0
)