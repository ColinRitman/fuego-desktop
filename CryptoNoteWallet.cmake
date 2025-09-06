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
if(APPLE)
    # macOS with Boost 1.89.0+ uses individual component packages
    find_package(boost_system REQUIRED)
    find_package(boost_filesystem REQUIRED)
    find_package(boost_thread REQUIRED)
    
    # Create a unified Boost target
    add_library(Boost::boost INTERFACE IMPORTED)
    target_link_libraries(Boost::boost INTERFACE 
        boost::system 
        boost::filesystem 
        boost::thread
    )
    
    # Set Boost variables for compatibility
    set(Boost_LIBRARIES boost::system boost::filesystem boost::thread)
    set(Boost_INCLUDE_DIRS ${boost_system_INCLUDE_DIRS})
else()
    # Linux/Windows use traditional Boost configuration
    set(Boost_NO_BOOST_CMAKE ON)
    set(Boost_USE_STATIC_LIBS OFF)
    set(Boost_USE_MULTITHREADED ON)
    set(Boost_USE_STATIC_RUNTIME OFF)
    find_package(Boost REQUIRED COMPONENTS system filesystem thread)
endif()

# CryptoNote library is already created in main CMakeLists.txt
# This file only provides Boost configuration and include directories