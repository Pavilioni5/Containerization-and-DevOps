package com.example;

public class Calculator {

    public int divide(int a, int b) {
        return a / b; // bug
    }

    public int add(int a, int b) {
        int result = a + b;
        int unused = 100; // code smell
        return result;
    }

    public String getUser(String userId) {
        String query = "SELECT * FROM users WHERE id=" + userId; // vulnerability
        return query;
    }

    public int multiply(int a, int b) {
        int result = 0;
        for(int i=0;i<b;i++){
            result += a;
        }
        return result;
    }

    public int multiplyAlt(int a, int b) {
        int result = 0;
        for(int i=0;i<b;i++){
            result += a;
        }
        return result;
    }

    public String getName(String name) {
        return name.toUpperCase(); // null risk
    }

    public void riskyOperation() {
        try {
            int x = 10 / 0;
        } catch(Exception e) {
        }
    }
}
