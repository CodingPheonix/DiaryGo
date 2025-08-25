from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client["dairygo"]

diary = db["diary"]