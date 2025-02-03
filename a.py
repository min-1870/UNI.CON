class Shape:
    def __init__(self, name, color, area):
        self.name = ""
        self.color = ""
        self.area = 0
    
    def info(self):
        print(f"Name: {self.name} Area: {self.area}")

class Circle(Shape):
    def __init__(self, name, color, area):
        super().__init__(name, color, area)
        
    def area(self, r):
        self.area = 3.14 * r ** 2
    
    def info(self):
        print(f"Name: {self.name} Area: {self.area}")

class Square(Shape):
    def __init__(self, name, color, area):
        super().__init__(name, color, area)
        
    def area(self, length):
        self.area = length ** 2
    
    def info(self):
        print(f"Name: {self.name} Area: {self.area}")



a = Circle("cl", "red", "0")

a.info()