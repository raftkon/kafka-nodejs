#!/bin/bash

display_options() {
    echo "Choose: "
    echo "1) make"
    echo "2) kill"
    echo "3) logs"
}

handle_choice() {
    case $1 in
        1)
            docker compose up --build --remove-orphans -d
        ;;
        2)
            docker compose down
        ;;
        3)
            docker compose logs -f
        ;;
        *)
            echo "Invalid choice, please select 1, 2 or 3"
            exit 1
        ;;
    esac
}

display_options

read -p "Enter your choice [1, 2 or 3]: " option

handle_choice $option
